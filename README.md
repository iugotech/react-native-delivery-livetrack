# react-native-delivery-livetrack

## Getting started


`$ npm install @react-native-mapbox-gl/maps --save`
`$ npm install "iugotech/react-native-delivery-livetrack#master" --save`

### Mostly automatic installation

`$ cd ios && pod install && cd ..`

## Usage
```javascript
import { LiveTrackMap } from 'react-native-delivery-livetrack';

// USAGE
<View 
  style={{
      height: '100%',
      backgroundColor: 'red'
  }}
>
  <LiveTrackMap branchId={1479} driverId={36854} orderIds={"51,52"}/>

</View>
```
