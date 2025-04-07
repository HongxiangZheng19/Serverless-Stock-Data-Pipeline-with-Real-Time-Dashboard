import pandas as pd
import os

folder_path = './stocks' 
output_file = '20_combined_stock_data.csv'

combined_df = pd.DataFrame()
max_files = 20

for i, filename in enumerate(os.listdir(folder_path)):
    if filename.endswith('.csv') and i < max_files:
        symbol = filename.replace('.csv', '')
        file_path = os.path.join(folder_path, filename)
        try:
            df = pd.read_csv(file_path)
            
            df['Symbol'] = symbol
            combined_df = pd.concat([combined_df, df], ignore_index=True)
            print(f"Added {filename} with {len(df)} rows")
        except Exception as e:
            print(f"Skipping {filename}: {e}")

combined_df.to_csv(output_file, index=False)
print(f"Combined file saved as {output_file} with {len(combined_df)} total rows.")
