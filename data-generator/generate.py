import pandas as pd
import time
import json
import boto3
import signal
import sys

CSV_FILE = "combined_stock_data.csv"
DELAY = 0.5
KINESIS_STREAM_NAME = "stock-data-stream"

should_run = True

def shutdown_handler(sig, frame):
    global should_run
    print("\n End stream")
    should_run = False

signal.signal(signal.SIGINT, shutdown_handler)

def send_to_kinesis(record, client):
    response = client.put_record(
        StreamName=KINESIS_STREAM_NAME,
        Data=json.dumps(record),
        PartitionKey=record["symbol"]
    )
    return response

def simulate_stream(csv_path):
    df = pd.read_csv(csv_path)
    df = df.sample(frac=1).reset_index(drop=True)

    client = boto3.client("kinesis", region_name="us-east-2")

    for _, row in df.iterrows():
        if not should_run:
            print("Stream stopped. Exiting loop.")
            break

        record = {
            "symbol": row.get("Symbol", ""),
            "date": row.get("Date", ""),
            "open": row.get("Open", ""),
            "close": row.get("Close", ""),
            "high": row.get("High", ""),
            "low": row.get("Low", ""),
            "volume": row.get("Volume", "")
        }

        print("Sending:", record)
        try:
            send_to_kinesis(record, client)
        except Exception as e:
            print("Error sending to Kinesis:", e)

        time.sleep(DELAY)

if __name__ == "__main__":
    print(f"Streaming from {CSV_FILE} to Kinesis stream: {KINESIS_STREAM_NAME}")
    simulate_stream(CSV_FILE)
    print("Done.")
