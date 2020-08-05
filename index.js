import React, {useState, useEffect, useContext, useRef, useCallback} from 'react';
import { View, NativeModules, Dimensions } from 'react-native';
import MapboxGL from "@react-native-mapbox-gl/maps";
import {APP_API_URL, APP_API_KEY_DOMINOS} from "./config"
import dominosBranch from "./assets/images/dominos-marker-2.png";
import dominosDriver from "./assets/images/driver-icon.png";

import {featureCollection as makeFeatureCollection, feature as makeFeature} from '@turf/helpers';

const { DeliveryLivetrack } = NativeModules;
const ITU_OFFICE_COORDINATE = [29.024633, 41.106051];
const accessToken = "pk.eyJ1Ijoib21lcmR1cmFrZXIiLCJhIjoiY2s2YWhjb2IzMDU5ZDNrcGk0dWd3MHRqcSJ9.8wdSh_dXmUTSCzMtI4nt9g";
const ScreenHeight = Dimensions.get('window').height;
const ScreenWidth = Dimensions.get('window').width;

MapboxGL.setAccessToken(accessToken);

const mapStyles = {
    storeIcon: {
        iconImage: dominosBranch,
        iconAllowOverlap: true,
        iconSize: 0.75,
    },
    driverIcon: {
        iconImage: dominosDriver,
        iconAllowOverlap: true,
        iconSize: 0.18,
    },
};

const LiveTrackMap = (props) => {

    const [ socket, setSocket ] = useState({});
    const [ socketState, setSocketState ] = useState(false);
    const [ stores, setStores] = useState([]);
    const [ drivers, setDrivers ] = useState([]);
    const [ center, setCenter] = useState(ITU_OFFICE_COORDINATE)
    const [ curCenter, setCurCenter] = useState([0, 0])

    let clockCallSocket = {};
    let cameraRef = useRef(undefined);

    useEffect(() => {
        console.log("Component did mount!");

        fetch(APP_API_URL + '/ms/zoneByExtId/' + props.branchId, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': APP_API_KEY_DOMINOS,
            }
        })
        .then((response) => response.json())
        .then((json) => {
            console.log("Received Branch Data:", json)
            setStores(json);
        })
        .catch(err => {
            console.log(err)
        });
        
        setTimeout(()=>{ socketInit(props.branchId) }, 5000)
        

    }, []);

    socketInit = (branchId) => {
        if (!socketState) {
          console.log('socket initiliazed...');
          
          let socket_c = new WebSocket('wss://live-dominos.iugo.tech/ws?branchID=' + branchId);
          socket_c.onopen = socketOpen;
          socket_c.onclose = socketClose;
          socket_c.onerror = socketError;
          socket_c.onmessage = socketMessage;

          setSocket(socket_c);
          setSocketState(true);
        }

        if (clockCallSocket) {
            clearInterval(clockCallSocket);
         }

         clockCallSocket = setInterval(() => {
            socketInit(branchId);
         }, 10000);

         if(socketState && socket.readyState === WebSocket.OPEN){
            
        }
    };
    
    socketError = d => {
        console.log('Socket ERROR', d);
        setSocketState(false);

    };
    
    socketOpen = d => {
        // this.getData(this.state.minDate, this.state.maxDate);
        //console.log('Socket is Opened', d);
        setSocketState(true);
    };
    
    socketClose = d => {
        //console.log('Socket is Closed', d);

        if (clockCallSocket) {
            clearInterval(clockCallSocket);
        }

        socket.close();
        setSocketState(false);

    };
    
    socketMessage = message => {

        let parsedData = JSON.parse(message.data);

        console.log(" Message Received", parsedData);

        let data =[];

        if (!Array.isArray(parsedData)){
            data = [parsedData]
        } else {
            data = parsedData
        }

        filteredData = data.filter((d) => {
            return d.driver_id == props.driverId
        })

        setDrivers(filteredData)
        //console.log("Setting Drivers")

    };

    returnStoreMarkers = () => {

        let featureCollection = makeFeatureCollection([])


        for(let i=0; i < stores.length; i++){

            let coordinatesStr = stores[i].coordinates;
            //console.log("Coordinates:", coordinatesStr);

            if (coordinatesStr.length > 10){
                let coordinates = coordinatesStr.split(' ');
                // console.log(coordinates, coordinates.length);
                if (coordinates.length === 2){
                    

                    const feature = makeFeature({
                        type: 'Point',
                        coordinates: [Number(coordinates[1]), Number(coordinates[0])],
                    });
                    
                    featureCollection.features.push(feature);
                }
            }
        }

        //console.log("Feature Length:", featureCollection.features.length)
        if (featureCollection.features.length === 1){
            //console.log("Center", center)
            //console.log("Current Center", curCenter)
            if (center !== curCenter){

                if(cameraRef){
                    cameraRef.current.moveTo(featureCollection.features[0].geometry.coordinates)
                    setCenter(featureCollection.features[0].geometry.coordinates);
                    setCurCenter(featureCollection.features[0].geometry.coordinates);

                    //console.log("Flying to coordinate", featureCollection.features[0].geometry.coordinates)
                } else {
                    //console.log("Camera Ref not defined")
                }
            } else {
                //console.log("Center did not change")
            }
            
        } else {
            //console.log("Lenght did not match")
        }
            

        return featureCollection;
    }

    returnDriverMarkers = () => {

        let featureCollection = makeFeatureCollection([])


        for(let i=0; i < drivers.length; i++){

            //console.log("Driver info:", drivers)
            //console.log("Driver info:", drivers[i], drivers[i].lat, drivers[i].lon,  {a: 5, b: 10} )
            const feature = makeFeature({
                type: 'Point',
                coordinates: [drivers[i].lon, drivers[i].lat]
            });
            
            featureCollection.features.push(feature);

        }

        //console.log("Drivers Length:", featureCollection.features.length )
        for(let i=0; i < featureCollection.features.length; i++){
            //console.log("Driver ", i, ", coordinates:", featureCollection.features[i].geometry.coordinates)
        }

        if (featureCollection.features.length > 0){

            let lat0 = -1000;
            let lon0 = -1000;
            let lat1 = 1000;
            let lon1 = 1000;

            for(let i=0; i < featureCollection.features.length; i++){

                if(featureCollection.features[i].geometry.coordinates[0] > lon0){
                    lon0 = featureCollection.features[i].geometry.coordinates[0]
                }
        
                if(featureCollection.features[i].geometry.coordinates[1] > lat0){
                    lat0 = featureCollection.features[i].geometry.coordinates[1]
                }
        
                if(featureCollection.features[i].geometry.coordinates[0] < lon1){
                    lon1 = featureCollection.features[i].geometry.coordinates[0]
                }
        
                if(featureCollection.features[i].geometry.coordinates[1] < lat1){
                    lat1 = featureCollection.features[i].geometry.coordinates[1]
                }

            }

            if (center) {

                if(center[0] > lon0){
                    lon0 = center[0]
                }
        
                if(center[1] > lat0){
                    lat0 = center[1]
                }
        
                if(center[0] < lon1){
                    lon1 = center[0]
                }
        
                if(center[1] < lat1){
                    lat1 = center[1]
                }
            }


            cameraRef.current.fitBounds([lon0, lat0], [lon1, lat1], 100, 1000)
        }
            

        return featureCollection;
    }    

    return (
        <View
            style={{height: '100%', width: '100%', backgroundColor: 'blue'}}
        >
            <MapboxGL.MapView
                style={{flex:1,}}
                styleURL={MapboxGL.StyleURL.Street}
                compassViewPosition={1} // for ios compass position
                compassViewMargins={{ x: ScreenWidth * 0.05, y: ScreenHeight * 0.12 }} // for android compass position
                onPress={() => {}}
                zoomEnabled={false}
                scrollEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
            >
                <MapboxGL.Camera
                    ref={useCallback((c) => {
                        console.log("Setting Camera Ref!");
                        cameraRef.current = c;                        
                    })}
                    zoomLevel={16}
                    animationMode={"flyTo"}
                    animationDuration={5000}
                    centerCoordinate={center}
                />      

                    <MapboxGL.ShapeSource
                        id="store_markers"
                        onPress={e => {}}
                        shape={returnStoreMarkers()}
                    >    

                        <MapboxGL.SymbolLayer
                            id="store_symbol"
                            style={mapStyles.storeIcon}
                        />

                    </MapboxGL.ShapeSource>

                    <MapboxGL.ShapeSource
                        id="driver_markers"
                        onPress={e => {}}
                        shape={returnDriverMarkers()}
                    >    

                        <MapboxGL.SymbolLayer
                            id="driver_symbol"
                            style={mapStyles.driverIcon}
                        />

                    </MapboxGL.ShapeSource>                    
                
            </MapboxGL.MapView>        

        </View>
    )
}

export {
    DeliveryLivetrack,
    LiveTrackMap
}
