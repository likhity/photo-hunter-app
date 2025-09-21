# Photo Hunter App

A React Native app for discovering and photographing interesting locations around Barcelona.

## Features

- **Interactive Map**: Explore photo hunt locations on a beautiful dark-themed map
- **Location Tracking**: Camera follows your location with smooth animations
- **Photo Hunt Locations**: 30 carefully selected Barcelona landmarks and attractions
- **Bottom Sheet UI**: Beautiful red-themed bottom sheet for selected locations
- **Distance Calculation**: Real-time distance calculation from your current location
- **Route Planning**: Get directions to selected photo hunt locations

## Components

### Map Component

- Uses Mapbox for high-quality mapping
- Camera follows user location automatically
- Shows photo hunt markers with custom icons
- Displays route lines when a location is selected

### Photo Hunt Markers

- Custom camera-shaped icons for each location
- Clustering for better performance with many markers
- Tap to select and view details

### Selected Photo Hunt Sheet

- Red-themed bottom sheet inspired by modern UI design
- Shows location name, description, and distance
- Action button for taking photos
- Smooth animations and gestures

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Mapbox** for mapping functionality
- **Expo Location** for GPS tracking
- **@gorhom/bottom-sheet** for smooth bottom sheet UI
- **Turf.js** for geospatial calculations

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up your Mapbox token:

   Create a `.env` file in the root directory:

   ```bash
   # Mapbox Configuration
   # Get your token from: https://account.mapbox.com/access-tokens/
   RNMapboxMapsDownloadToken=your_mapbox_token_here
   ```

   Replace `your_mapbox_token_here` with your actual Mapbox token from [Mapbox Account](https://account.mapbox.com/access-tokens/).

3. Run the app:
   ```bash
   npm start
   ```

## Photo Hunt Locations

The app includes 30 Barcelona landmarks including:

- Sagrada Familia
- Park Güell
- Casa Batlló
- Las Ramblas
- Casa Milà
- And many more!

Each location has a unique description and challenge for photographers.
