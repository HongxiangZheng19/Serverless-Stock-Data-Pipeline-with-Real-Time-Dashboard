import json
import boto3
import os
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ.get("TABLE_NAME", "stock-data-table"))

def lambda_handler(event, context):
    symbol = event.get("queryStringParameters", {}).get("symbol", "")
    if not symbol:
        return {
            "statusCode": 400,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET"
            },
            "body": json.dumps({"error": "Missing symbol"})
        }

    try:
        response = table.query(
            KeyConditionExpression=Key("symbol").eq(symbol)
        )
        items = sorted(response["Items"], key=lambda x: x["date"])

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET"
            },
            "body": json.dumps(items)
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Methods": "GET"
            },
            "body": json.dumps({"error": str(e)})
        }
