variable "finnhub_api_key" {
  description = "API key for Finnhub stock data"
  type        = string
  sensitive   = true
}

variable "enable_schedule" {
  default = false
}

variable "region" {
  default = "us-east-2"
}