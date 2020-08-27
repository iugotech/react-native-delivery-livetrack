import React, {useEffect, useRef, useState,} from 'react';
import { View, Animated, Dimensions, Image, Text, StyleSheet } from 'react-native';
const clockIcon = require('./assets/images/clock.png');

const screenWidth = Math.round(Dimensions.get('window').width);
const widgetWidth = 0.8*(screenWidth-40) + 20;

const calculateSliderValue = (min) => {
    if (min >= 20){
        return -widgetWidth
    } else if (min <= 0) {
        return 0
    } else {
        return -(min / 23 * widgetWidth)
    }

}

export const TimeSlider = (props) => {

    const [selectedTimeIndx, setSelectedTimeIndx] = useState(0) 
    const sliderAnim = useRef(new Animated.Value(-0.8*(screenWidth-40) + 20)).current;


    useEffect(() => {
        setTimeout(()=>{

        let min = props.min;    
        Animated.timing(sliderAnim, {
            toValue: calculateSliderValue(min),
            duration: 1000,
        }).start(); 

        if (min > 20) {min = 20};
        if (min < 0) {min = 0};
        setSelectedTimeIndx(4 - Math.round(min/5))

        },3000)   
    }, [props.min])

    return(
        
            <View style={{           
                    marginTop: 10,                 
                    height: 70,
                    width: '80%',
                    backgroundColor: 'transparent',
                    overflow: 'hidden'
                }}>
                    <View style={{
                        position: 'absolute',
                        top: 12,
                        borderRadius: 3,
                        height: 6,
                        width: '100%',
                        backgroundColor: 'rgb(230,230,230)',
                    }}>
                    </View>
                    <Animated.View style={{        
                        transform: [{translateX: sliderAnim}],
                        flexDirection: 'row',  
                        height: 30,                      
                        alignItems:'center',
                    }}>
                        <View style={{        
                            height: 6,
                            width: '100%',
                            backgroundColor: 'rgb(25,97,245)',
                            borderRadius: 3,
                        }}>
                        </View>                        
                        <Image
                        style={{
                                height: 20,
                                width: 20,
                                borderRadius: 10,
                                borderStyle: 'solid',
                                marginLeft: -20,
                                backgroundColor: 'white'
                            }}
                        source={clockIcon}
                        />
                    </Animated.View>

                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            height: 18,
                            width: '100%',
                            alignItems: 'center'
                        }}
                    >
                        <Text style={[styles.timeText, selectedTimeIndx === 0 ? {color: 'rgb(25,97,245)'} : {}]}>20 dk</Text>
                        <Text style={[styles.timeText, selectedTimeIndx === 1 ? {color: 'rgb(25,97,245)'} : {}]}>15 dk</Text>
                        <Text style={[styles.timeText, selectedTimeIndx === 2 ? {color: 'rgb(25,97,245)'} : {}]}>10 dk</Text>
                        <Text style={[styles.timeText, selectedTimeIndx === 3 ? {color: 'rgb(25,97,245)'} : {}]}>5 dk</Text>
                        <Text style={[styles.timeText, selectedTimeIndx === 4 ? {color: 'rgb(25,97,245)'} : {}]}>0 dk</Text>

                    </View>
                    
            </View>

    )
}

const styles = StyleSheet.create({
    timeText: {
      color: 'rgb(165,165,165)',
      fontSize: 12,
      fontWeight: '500'
    },
    
  });
