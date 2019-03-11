// console.log("hello from index")
let capture;
let submitButton;
let locationData;
let weatherData;

let ctracker;
let ec, emotionData;
let emotionRate;

let emotions = [];

let noiseY;
let noiseSpeed = 0.01;
let noiseHeight = 10;

function setup(){
    createCanvas(200, 200).id('hidden');
    capture = createCapture(VIDEO);
    capture.parent('#mySketch');
    // capture.hide();
    capture.size(width, height);
    imageMode(CENTER);
    getCurrentPosition(doThisOnLocation);

    ctracker = new clm.tracker();
    ctracker.init(pModel);
    ctracker.start(capture.elt);

    ec = new emotionClassifier();
    ec.init(emotionModel);
    emotionData = ec.getBlank();

    pixelDensity(1);

    submitButton = select("#submitButton");
    submitButton.mousePressed(handleSubmit);

    noStroke();

    noiseY = height * 3 / 4;
}

function handleSubmit(e){
    let output = {
        location: {},
        weather: weatherData,
        emotion: emotionRate,
        image: ''
    };
    
    output.location.lat = locationData.latitude;
    output.location.lon = locationData.longitude;
    
    const last_img = get();
    output.image = last_img.canvas.toDataURL()

    console.log(last_img)

    const options = {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            // "Content-Type": "application/x-www-form-urlencoded",
        },
        body: JSON.stringify(output)
    };
    fetch(`/api`, options).then(result => {
        // updateMyDots()
        console.log('success')
    })

    // httpPost("/api", output, (result) =>{
    //     // console.log(result);
    //     console.log("success")
    // });
}

function doThisOnLocation(position){
    locationData = position;
    console.log(position.latitude);
    console.log(position.longitude);
    select("#lat").html( nfc(position.latitude, 4));
    select("#lon").html( nfc(position.longitude, 4));

    getWeather(position.latitude, position.longitude);
}

function getWeather(lat, lng){
    weatherData = loadJSON('/weather/' + lat + "/" + lng, function(){
        let wImg = document.createElement('img');
        wImg.src = weatherData.current.imageUrl;
        wImg.id = "weather";

        document.getElementById('weatherImg').appendChild(wImg);
        select('#temp').html(weatherData.current.temperature);
    });
}

function draw(){
    background(220);

    if(capture != null){
        colorMode(RGB);
        capture.loadPixels();

        for(let y = 0; y < height; y++){
            for(let x = 0; x < width; x++){
                let i = (width * y + x) * 4;
                let gray = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];

                let randomPix = 0;

                if(weatherData && weatherData.current){
                    let currentTemp = weatherData.current.temperature;
                    let randomRange;
                    if(currentTemp < 15){
                        randomRange = map(weatherData.current.temperature, -10, 15, 100, 2);
                    }else{
                        randomRange = map(weatherData.current.temperature, 15, 40, 2, 100);
                    }
                    randomPix =  int(random(-randomRange, randomRange));
                }
                pixels[i - randomPix] = pixels[i - randomPix + 1] = pixels[i - randomPix + 2] = gray;
            }

        }

        capture.updatePixels();
    }

    image(capture,width/2,height/2, width*1.3, height);

    let currentParam = ctracker.getCurrentParameters();
    emotionRate = ec.meanPredict(currentParam);

    /*
    angry, disgusted, fear, sad, surprised, happy
     */
    if(emotionRate){
        //console.log(er);
        let angryVal = emotionRate[0].value;
        let sadVal = emotionRate[3].value;
        let surprisedVal = emotionRate[4].value;
        let happyVal = emotionRate[5].value;

        // fill(255, 0, 0, angryVal * 0.5);
        // ellipse(0, 0, angryVal * 2, angryVal * 2);
        //
        // fill(0, 0, 255, sadVal * 0.5);
        // ellipse(width, 0, sadVal * 2, sadVal * 2);
        //
        // fill(0, 255, 0, surprisedVal * 0.5);
        // ellipse(0, height, surprisedVal * 2, surprisedVal * 2);
        //
        // fill(255, 255, 0, happyVal * 0.5);
        // ellipse(width, height, happyVal * 2, happyVal * 2);

        push();
        colorMode(HSB, 360, 100, 100, 100);
        for (let j = 0; j < 6; j++) {
            noFill();
            let alpha = emotionRate[j].value * 60;
            stroke(360 / j, 80, 100, alpha);

            let baseHeight = map(emotionRate[j].value, 0, 1, height / 2, height * 3 / 4) + height / 4;
            strokeWeight(height / 2);
            beginShape();
            curveVertex(0, baseHeight);
            for (let i = 0; i <= width; i += 20) {
                let y = noise(frameCount * noiseSpeed + i + j) * noiseHeight + baseHeight;
                curveVertex(i, y);
            }
            curveVertex(width, baseHeight);
            endShape(LINES);
        }
        pop();
    }
}

function truncateColor(value) {
    if (value < 0) {
        value = 0;
    } else if (value > 255) {
        value = 255;
    }
    return value;
}

class Emotion{
    constructor(cat, val){
        this.cat = cat;
        this.val = int(val);

        switch(cat){
            case 0:
                this.col = color(255, 0, 0, 50);
                break;
            case 1:
                this.col = color(0, 0, 255, 50);
                break;
            case 2:
                this.col = color(0, 255, 255, 50);
                break;
            case 3:
                this.col = color(255, 255, 0, 50);
                break;
        }
    }

    update(val){
        this.val = val;
    }


}