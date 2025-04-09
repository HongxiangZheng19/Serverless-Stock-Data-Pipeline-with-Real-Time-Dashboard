import json
import boto3
import os
import requests
import time
from datetime import datetime, timezone

KINESIS_STREAM_NAME = os.environ.get("KINESIS_STREAM_NAME", "stock-data-stream")
FINNHUB_API_KEY = os.environ.get("FINNHUB_API_KEY")

STOCK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]

kinesis_client = boto3.client("kinesis")


def fetch_stock_price(symbol):
    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()

        # validation 
        if data["c"] == 0:
            print(f"No valid price for {symbol}, skipping.")
            return None

        return {
            "symbol": symbol,
            "date": datetime.now(timezone.utc).isoformat(),
            "open": data["o"],
            "high": data["h"],
            "low": data["l"],
            "close": data["c"],
            "volume": data.get("v", 0)
        }
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None


def lambda_handler(event, context):
    print(f"Fetching stock data for: {', '.join(STOCK_SYMBOLS)}")

    for symbol in STOCK_SYMBOLS:
        stock_data = fetch_stock_price(symbol)
        if stock_data:
            try:
                kinesis_client.put_record(
                    StreamName=KINESIS_STREAM_NAME,
                    Data=json.dumps(stock_data),
                    PartitionKey=symbol
                )
                print(f"Sent {symbol} data to Kinesis.")
            except Exception as e:
                print(f"Failed to send {symbol} to Kinesis: {e}")
        time.sleep(1)  

    return {
        "statusCode": 200,
        "body": json.dumps({"message": "Stock data streaming complete."})
    }
