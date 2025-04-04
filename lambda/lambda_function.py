import json
import base64
import boto3
import os

dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("TABLE_NAME", "stock-data-table")
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    for record in event["Records"]:
        try:
            payload = base64.b64decode(record["kinesis"]["data"]).decode("utf-8")
            data = json.loads(payload)

            table.put_item(Item={
                "symbol": data["symbol"],
                "date": data["date"],
                "open": str(data["open"]),
                "close": str(data["close"]),
                "high": str(data["high"]),
                "low": str(data["low"]),
                "volume": str(data["volume"])
            })

            print("Inserted:", data)
        except Exception as e:
            print("Error:", str(e))

    return {"statusCode": 200}
