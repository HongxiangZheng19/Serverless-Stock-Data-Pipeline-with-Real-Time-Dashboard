import boto3
import os
import json

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("TABLE_NAME", "stock-data-table"))

def lambda_handler(event, context):
    try:
        seen = set()
        symbols = []

        response = table.scan()
        for item in response.get("Items", []):
            symbol = item.get("symbol")
            if symbol and symbol not in seen:
                seen.add(symbol)
                symbols.append(symbol)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*"
            },
            "body": json.dumps(sorted(symbols))
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
                "Access-Control-Allow-Headers": "*"
            },
            "body": json.dumps({"error": str(e)})
        }
