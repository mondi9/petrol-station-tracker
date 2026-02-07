# Utility Scripts

This directory contains utility scripts for managing the Petrol Station Tracker application.

## Available Scripts

### Add Sample Queue Data

Adds realistic sample queue data to all stations in Firebase to demonstrate the color-coded queue status feature.

**Usage**:

```bash
# 1. Navigate to scripts directory
cd scripts

# 2. Install dependencies (first time only)
npm install

# 3. Copy environment variables from parent directory
# Make sure your .env file is in the parent directory with Firebase credentials

# 4. Run the script
npm run add-queue-data
```

**What it does**:
- Fetches all stations from Firebase
- Adds queue times for each fuel type the station has
- Distribution: 40% short (5-15 min), 40% medium (16-30 min), 20% long (31-60 min)
- Updates `queue` object and `lastQueueUpdate` timestamp

**Result**:
- Map markers will show different colors:
  - 🟢 Green = Short queue (≤15 min)
  - 🟡 Yellow = Medium queue (16-30 min)
  - 🔴 Red = Long queue (>30 min)

**Note**: This is for demonstration purposes. In production, queue data comes from user reports.
