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
        items = response.get("Items", [])

        # Paginate
        while "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))

        for item in items:
            symbol = item.get("symbol")
            if symbol and symbol not in seen:
                seen.add(symbol)
                symbols.append(symbol)

        return {
            "statusCode": 200,
            "body": json.dumps(sorted(symbols)),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }
