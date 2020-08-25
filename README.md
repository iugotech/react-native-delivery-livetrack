# react-native-delivery-livetrack

## Getting started


`$ npm install @react-native-mapbox-gl/maps --save`<br />
`$ npm install npm install react-native-star-rating --save`<br />
`$ npm install react-native-vector-icons --save`<br />
`$ npm install --save https://github.com/iugotech/react-native-delivery-livetrack/tarball/master`<br />
`$ react-native link react-native-vector-icons`
<br />
### Mostly automatic installation

`$ cd ios && pod install && cd ..`

## Usage
```javascript

import React, {useState} from 'react';
....

import { LiveTrackMap, isHotTrackingLive, retrieveHotTrackingInfo } from 'react-native-delivery-livetrack';

  const [data, setData] = useState(undefined)

//CHECK IF Tracking Started
 isHotTrackingLive("ABC123")
      .then(success => {
          console.log("isHotTrackingLive Success:", success) 
      })
      .catch(err => {
          console.log("isHotTrackingLive Error:", err)
      })


// IF HotTracking Started (if received success response from above request), then retrieve the hot tracking info
  retrieveHotTrackingInfo("ABC123")
      .then(data => {
          console.log("retrieveHotTrackingInfo Success:", data)
          
          // set data with returned response ==> data will be passed as props in below component
          setData(data)
      })
      .catch(err => {
          console.log("retrieveHotTrackingInfo Error:", err)
      }) 

// CHECK IF Order Delivered
  isOrderDelivered("ABC123")
      .then(data => {
          console.log("isOrderedDelivered Success:", data)
          
          // set data with returned response ==> data will be passed as props in below component
          setData(data)
      })
      .catch(err => {
          console.log("isOrderDelivered Error:", err)
      }) 


// Rendering Map View --> render only if data is available
{ data && 
  <View 
    style={{
        height: '100%',
        backgroundColor: 'red'
    }}
  >
    <LiveTrackMap {...data}/>

  </View>
}


```
