resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "StockAPI-Lambda-Errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert if Lambda has any errors"
  dimensions = {
    FunctionName = aws_lambda_function.stock_api_lambda.function_name
  }
  alarm_actions = [aws_sns_topic.alert_topic.arn]
}

resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "StockAPI-Lambda-HighDuration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Average"
  threshold           = 2000
  alarm_description   = "Alert if function duration is high"
  dimensions = {
    FunctionName = aws_lambda_function.stock_api_lambda.function_name
  }
  alarm_actions = [aws_sns_topic.alert_topic.arn]
}

resource "aws_sns_topic" "alert_topic" {
  name = "stock-pipeline-alerts"
}

resource "aws_sns_topic_subscription" "email_sub" {
  topic_arn = aws_sns_topic.alert_topic.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
