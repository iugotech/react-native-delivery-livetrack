import React, {useState, useEffect, useContext, useRef, useCallback} from 'react';
import { View, NativeModules, Dimensions, Image, Text, TouchableOpacity } from 'react-native';
import MapboxGL from "@react-native-mapbox-gl/maps";
import {APP_API_URL, APP_API_KEY_DOMINOS, DOMINOS_INTEGRATION_API_URL, APP_API_KEY_DOMINOSINTEGRATION} from "./config"
import StarRating from 'react-native-star-rating';
import {TimeSlider} from './TimeSlider'
import {useInterval} from './hooks/Interval';
import dominosBranch from "./assets/images/dominos-marker-2.png";
// import dominosBranch from "./assets/images/driver-icon.png";
import dominosDriver from "./assets/images/driver-icon.png";
import dominosPhone from "./assets/images/sube-telefon.png";
import dominosProfile from "./assets/images/profile.png";

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
        iconSize: 0.5,
    },
};

function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
      ref.current = value;
    });
    return ref.current;
  }

const LiveTrackMap = (props) => {

    const [ socket, setSocket ] = useState({});
    const [ socketState, setSocketState ] = useState(false);
    const [ stores, setStores] = useState([]);
    const [ drivers, setDrivers ] = useState([]);

    const [ center, setCenter] = useState(ITU_OFFICE_COORDINATE)
    const [ curCenter, setCurCenter] = useState([0, 0])

    let clockCallSocket = {};
    let cameraRef = useRef(undefined);

    const {branchId, driverId} = props
    const prevData = usePrevious({branchId, driverId});

    useEffect(() => {        

        if (props.branchId){
            fetch(APP_API_URL + '/ms/zoneByExtId/' + props.branchId, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': APP_API_KEY_DOMINOS,
                }
            })
            .then((response) => response.json())
            .then((json) => {
                //console.log("Received Branch Data:", json)
                setStores(json);
            })
            .catch(err => {
                //console.log(err)
            });
            
        }
        

    },[branchId, driverId]);

    useInterval(() => {
		socketInit(props.branchId);
	  }, 5000)

    socketInit = (branchId) => {
        if (!socketState) {
          //console.log('socket initiliazed...', branchId);
          
          let socket_c = new WebSocket('wss://live-dominos-test.iugo.tech/ws?branchID=' + branchId,{rejectUnauthorized: false});
          socket_c.onopen = socketOpen;
          socket_c.onclose = socketClose;
          socket_c.onerror = socketError;
          socket_c.onmessage = socketMessage;

          setSocket(socket_c);
          // setSocketState(true);
        }


        // if(socketState && socket.readyState === WebSocket.OPEN){
        //     console.log("sending message to socket")
        //     socket.send(JSON.stringify({type: "ping", data: []}))
        // }

        //console.log("ReadyState:", socket.readyState === WebSocket.OPEN, socket.readyState === WebSocket.CLOSED)

        // if(this.socketConnection && this.socket.readyState === WebSocket.OPEN){
        //     console.log("sending message to socket")
        //     this.socket.send(JSON.stringify({type: "ping", data: []}))
        // }
    };
    
    socketError = d => {
        //console.log('Socket ERROR', d);
        setSocketState(false);

    };
    
    socketOpen = d => {
        // this.getData(this.state.minDate, this.state.maxDate);
        // console.log('Socket is Opened', d);
        // console.log("sending message to socket")
        // socket.send(JSON.stringify({type: "ping", data: []}))
        setSocketState(true);
    };
    
    socketClose = d => {
        //console.log('Socket is Closed', d);

        // if (clockCallSocket) {
        //     clearInterval(clockCallSocket);
        // }

        //socket.close();
        setSocketState(false);

    };
    
    socketMessage = message => {

        //console.log("Socket Message:", message)

        let parsedData = JSON.parse(message.data);

        //console.log(" Message Received", parsedData);

        let data =[];

        if (!Array.isArray(parsedData)){
            data = [parsedData]
        } else {
            data = parsedData
        }

        //console.log("Filtered data", data)
        //filteredData = [data[0]];

        //console.log("filteredData:", filteredData)
        filteredData = data.filter((d) => {
            return d.driver_id == props.driverId
        })

        if (filteredData.length > 0){
            if (filteredData[0].status === 'returning' || filteredData[0].status === 'waiting'){
                if(props.onDelivered){
                    props.onDelivered();
                }
            }
        }

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
            if (center !== curCenter || (curCenter && (featureCollection.features[0].geometry.coordinates[0] !== curCenter[0] || featureCollection.features[0].geometry.coordinates[1] !== curCenter[1]))){
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
                        cameraRef.current = c;                        
                    })}
                    maxZoomLevel={16}
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


            {/* <View
                style={{
                    position: 'absolute',                    
                    width: '100%',
                    top: 30,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                }}
            >
                <View style={{flex:1, display: 'flex', flexDirection: 'column'}}>
                    <View
                        style={{
                            marginHorizontal: 37,
                            backgroundColor: 'rgb(63,72,89)',
                            height: 42,
                            borderRadius: 12,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            paddingTop: 6,
                            paddingLeft: 16,
                            paddingRight: 16,
                            // width: 100
                            
                        }}
                    >
                        <Text style={{fontSize: 15, fontWeight: 'bold', color: 'rgb(255,255,255)'}} >{'Siparişin Yolda'}</Text>
                        <Text style={{fontSize: 15, fontWeight: '700', color: 'rgb(255,255,255)'}} >{'30TL'}</Text>
                    </View>
                    <View
                        style={{
                            marginHorizontal: 20,
                            marginTop: -12,
                            backgroundColor: 'rgb(255,255,255)',
                            height: 90,
                            borderRadius: 12,
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        <Text style={{color: 'rgb(63, 72, 89)', marginTop: 7, fontWeight: '500'}}>Tahmini Kalan Süre</Text>
                        <TimeSlider min={13}/>
                    </View>
                </View>

            </View>

            <View 
                style={{
                    position: 'absolute',                    
                    width: '100%',
                    bottom: 0,
                    left: 0,
                    right: 0,
                }}>
                <View
                    style={{
                        marginBottom: 13,
                        marginLeft: 13,
                        marginRight: 16,
                        height: 97,
                        backgroundColor: 'rgb(255,255,255)',
                        borderRadius: 12,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                    <View
                        style={{
                            marginLeft: 20,
                            height: 60,
                            width: 60,
                            borderRadius: 30,
                            backgroundColor: 'rgb(230,230,230)',
                        }}
                    >
                        <Image style={{height: 60, width: 60}} source={dominosProfile} resizeMode={'cover'}/>

                    </View>
                    <View
                        style={{
                            display: 'flex',
                            flex: 1,
                            flexDirection: 'column',
                            marginLeft: 20,
                            justifyContent: 'center',
                            paddingTop: 20                            
                        }}
                    >
                        <Text style={{fontSize: 14, fontWeight: '300', color: 'rgb(63,72,89)'}} >{'Kurye'}</Text>
                        <Text style={{fontSize: 16, fontWeight: 'bold', color: 'rgb(63,72,89)'}} >{'Mustafa'}</Text>
                        <StarRating
                            disabled={false}
                            emptyStarColor= "#f9d71c"
                            fullStarColor="#f9d71c"
                            maxStars={5}
                            rating={4}
                            starSize={12}
                            selectedStar={(rating) => console.log(rating)}
                            containerStyle={{width: 80, marginTop: 4}}
                        />
                        <Text></Text>
                    </View>
                    <TouchableOpacity
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginRight: 12,
                            paddingTop: 13,
                            paddingBottom: 13,
                            height: 73,
                            width: 63,
                            borderRadius: 12,
                            backgroundColor: 'rgb(255,255,255)',
                            shadowColor: "#000",
                            shadowOffset: {
                                width: 0,
                                height: 0,
                            },
                            shadowOpacity: 0.22,
                            shadowRadius: 2.22,

                            elevation: 3,
                        }}
                        // onPress={()=>{console.log("pressed")}}
                    >
                        <View
                            style={{

                            }}
                        >
                            <Image style={{height:39, width: 38}} source={dominosPhone} resizeMode={'cover'}/>
                            <Text style={{fontSize: 9, fontWeight: '500', color: 'rgb(165,165,165)'}}>{"Şubeyi Ara"}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>       */}

        </View>
    )
}

const isHotTrackingLive = (trackerCode) => {
    
    return new Promise((resolve, reject) => {
        fetch(DOMINOS_INTEGRATION_API_URL + '/ms/isHotTrackingLive?trackerCode=' + trackerCode, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': APP_API_KEY_DOMINOSINTEGRATION,
            }
        })
        .then((response) => response.json())
        .then((json) => {
            // console.log("Received Data:", json)    
            let res = json.success;

            resolve(res)
        })
        .catch(err => {
            // console.log(err)
            reject(err)
        });
    })
    
}

const isOrderDelivered = (trackerCode) => {
    
    return new Promise((resolve, reject) => {
        fetch(DOMINOS_INTEGRATION_API_URL + '/ms/isOrderDelivered?trackerCode=' + trackerCode, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': APP_API_KEY_DOMINOSINTEGRATION,
            }
        })
        .then((response) => response.json())
        .then((json) => {
            // console.log("Received Data:", json)    
            let res = json.success;

            resolve(res)
        })
        .catch(err => {
            // console.log(err)
            reject(err)
        });
    })
    
}

const retrieveHotTrackingInfo = (trackerCode) => {

    return new Promise((resolve, reject) => {
        fetch(DOMINOS_INTEGRATION_API_URL + '/ms/hotTrackingInfo?trackerCode=' + trackerCode, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': APP_API_KEY_DOMINOSINTEGRATION,
            }
        })
        .then((response) => response.json())
        .then((json) => {
            // console.log("Received Data:", json)
            
            if (json.success){
                resolve(json.data)
            } else {
                reject("Info not available")
            }

        })
        .catch(err => {
            // console.log(err)
            reject(err)
        });
    })    

}

export {
    DeliveryLivetrack,
    LiveTrackMap,
    isHotTrackingLive,
    isOrderDelivered,
    retrieveHotTrackingInfo
}
