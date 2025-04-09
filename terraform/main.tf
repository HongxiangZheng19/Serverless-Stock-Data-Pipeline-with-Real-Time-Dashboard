# terraform apply -var-file=".env.tfvars"

provider "aws" {
  region = var.region
}

# Kinesis Stream 
resource "aws_kinesis_stream" "stock_stream" {
  name             = "stock-data-stream"
  shard_count      = 1
  retention_period = 24

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  tags = {
    Environment = "dev"
    Project     = "stock-pipeline"
  }
}

# DynamoDB Table
resource "aws_dynamodb_table" "stock_table" {
  name         = "stock-data-table"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "symbol"
  range_key    = "date"

  attribute {
    name = "symbol"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  tags = {
    Name        = "StockDataTable"
    Environment = "dev"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "lambda-stock-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Principal = {
        Service = "lambda.amazonaws.com"
      },
      Effect = "Allow",
      Sid = ""
    }]
  })
}

# IAM Policies
resource "aws_iam_policy_attachment" "lambda_basic_execution" {
  name       = "lambda-basic-execution"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_policy_attachment" "lambda_kinesis_access" {
  name       = "lambda-kinesis-access"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonKinesisFullAccess"
}

resource "aws_iam_policy_attachment" "lambda_dynamo_access" {
  name       = "lambda-dynamo-access"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

# Lambda Function
resource "aws_lambda_function" "stock_api_lambda" {
  filename         = "${path.module}/../lambda/stock_api_lambda.zip"
  function_name    = "stock-api-lambda"
  role             = aws_iam_role.lambda_role.arn
  handler          = "stock_api_lambda.lambda_handler"
  runtime          = "python3.9"
  source_code_hash = filebase64sha256("${path.module}/../lambda/stock_api_lambda.zip")
  timeout          = 30  
  memory_size      = 256  

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.stock_table.name
    }
  }
}

resource "aws_lambda_function" "live_fetch_lambda" {
  filename         = "${path.module}/../lambda/live_fetch_lambda.zip"
  function_name    = "live-fetch-lambda"
  role             = aws_iam_role.lambda_role.arn
  handler          = "live_fetch_lambda.lambda_handler"  
  runtime          = "python3.9"
  timeout          = 30
  source_code_hash = filebase64sha256("${path.module}/../lambda/live_fetch_lambda.zip")

  environment {
    variables = {
      KINESIS_STREAM_NAME = aws_kinesis_stream.stock_stream.name
      FINNHUB_API_KEY     = var.finnhub_api_key
    }
  }
}

# Scheduled Lambda Trigger (EventBridge)
# EventBridge Schedule Rule (every 5 minutes)
resource "aws_cloudwatch_event_rule" "five_min_schedule" {
  name                = "every-5-mins"
  schedule_expression = "rate(5 minutes)"
  description         = "Triggers live stock data fetch Lambda every 5 minutes"
  is_enabled          = var.enable_schedule
}

# EventBridge Target → Lambda
resource "aws_cloudwatch_event_target" "trigger_live_fetch" {
  rule      = aws_cloudwatch_event_rule.five_min_schedule.name
  target_id = "live-fetch-lambda-trigger"
  arn       = aws_lambda_function.live_fetch_lambda.arn
}

# Invoke Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.live_fetch_lambda.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.five_min_schedule.arn
}

# API Gateway
resource "aws_api_gateway_rest_api" "stock_api" {
  name        = "StockDataAPI"
  description = "API for querying stock data from DynamoDB"
}

resource "aws_api_gateway_resource" "symbol_resource" {
  rest_api_id = aws_api_gateway_rest_api.stock_api.id
  parent_id   = aws_api_gateway_rest_api.stock_api.root_resource_id
  path_part   = "symbol"
}

resource "aws_api_gateway_method" "get_method" {
  rest_api_id   = aws_api_gateway_rest_api.stock_api.id
  resource_id   = aws_api_gateway_resource.symbol_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.stock_api.id
  resource_id             = aws_api_gateway_resource.symbol_resource.id
  http_method             = aws_api_gateway_method.get_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.stock_api_lambda.invoke_arn
}

resource "aws_lambda_permission" "allow_api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stock_api_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.stock_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on   = [aws_api_gateway_integration.lambda_integration]
  rest_api_id  = aws_api_gateway_rest_api.stock_api.id
  stage_name   = "prod"
}

# --- Outputs ---
output "kinesis_stream_name" {
  value = aws_kinesis_stream.stock_stream.name
}
