output "dynamodb_table_name" {
  value = aws_dynamodb_table.stock_table.name
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda_role.arn
}

output "api_gateway_url" {
  value = "${aws_api_gateway_deployment.api_deployment.invoke_url}/symbol"
}
