var jsonData;
var dataShuffled;

var tsne;

var sampleSize;
var stepsPerUpdate = 10;
var dataGraph_x, dataGraph_y, dataGraph_z;

var intervalHandler;
var iterationsCount = 0;
var isRunning = false;
var isReset = true;


$( document ).ready(function() {
    initGraph();
    $( "#chooseTestSelect" ).val('big5');
    $( "#chooseTestSelect" ).change();
});

$( "#chooseTestSelect" ).change( function() {
    $( "#loadingStatusA" ).text( "Loading..." );
    let stringValue = $( this ).val();
    $.getJSON( "data/" + stringValue + ".json", function( content ) {
        jsonData = content;
        createCheckboxes();
        createColors();
        $( "#loadingStatusA" ).text( "Loading done :)" );
        $( "#nextSectionDiv" ).show();
    });
});

$( "#chooseColorSelect" ).change(function() {
    updateColor();
});


$( "#runButton" ).click(function() {
    if( isReset ){
        initTsne();
        updateColor();
        isReset = false;
    }
    if( !isRunning ){
        intervalHandler = setInterval(nextStep, 50);
        $( this ).text("stop");
        isRunning = true;
    } else {
        clearInterval( intervalHandler );
        $( this ).text("start");
        isRunning = false;
    }
});

$( "#restartButton" ).click(function() {
    iterationsCount = 0;
    $( "#iterationA" ).text( 0 );
    clearInterval( intervalHandler );
    $( "#runButton" ).text("start");
    isRunning = false;
    isReset = true;
});

function initTsne(){
    let opt = {}
    opt.epsilon = $( "#epsilonInput" ).val();
    opt.perplexity = $( "#perplexityInput" ).val();
    opt.dim = 3;
    tsne = new tsnejs.tSNE( opt );

    dataShuffled = [];
    let copy = jsonData["data"];
    sampleSize = $( "#sampleSizeInput" ).val();
    for(let i = 0; i < sampleSize; i++){
        dataShuffled.push(copy.splice(getRandomInt(0, copy.length), 1)[0]);
    }
    let indexes = []
    let keys = Object.keys( jsonData.dataOptions );
    for (key of keys){
        if( $( "#" + key + "Checkbox" ).prop( "checked" )){
            indexes.push(jsonData.dataOptions[key]);
        }
    }
    console.log(indexes);
    let dataIndexed = [];
    for(item of dataShuffled){
        let temp = []
        for(index of indexes){
            for(let i = index[0]; i < index[1] + 1; i++){
                temp.push(item[i]);
            }
        }
        dataIndexed.push(temp);
    }
    console.log(dataIndexed);
    tsne.initDataRaw( dataIndexed );
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

function nextStep(){
    let cost = tsne.step()
    iterationsCount++;
    $( "#iterationA" ).text( iterationsCount );
    $( "#costA" ).text( cost );
    if ( iterationsCount % stepsPerUpdate == 0){
        let dataGraph = tsne.getSolution();
        for( let i = 0; i < sampleSize; i++ ){
            dataGraph_x[i] = (dataGraph[i][0]);
            dataGraph_y[i] = (dataGraph[i][1]);
            dataGraph_z[i] = (dataGraph[i][2]);
        }
        updateData();
    };

}

function initGraph(){
    dataGraph_x = [0];
    dataGraph_y = [0];
    dataGraph_z = [0];
    var trace = {
        x: dataGraph_x,
        y: dataGraph_y,
        z: dataGraph_z,
        mode: 'markers',
        marker: {
            color: [0],
            size: 5,
            symbol: 'circle',
            /*line: {
                width: 1
            },*/
            opacity: 0.9},
        type: 'scatter3d'};
    dataTrace = [trace];
    var layout = {
        scene : {
            margin: {
                l: 0,
                r: 0,
                b: 0,
                t: 0
            },
            showlegend: true,
            legend: {
            }
        }
    };
    var config = {responsive: true};
    Plotly.newPlot("graphContainer", dataTrace, layout, config);
}

function updateData() {
    Plotly.animate("graphContainer", {
        data: [{x: dataGraph_x, y: dataGraph_y, z: dataGraph_z}],
        traces: [0]
    }, {
        transition: {
        duration: 300,
        easing: 'cubic-in-out'
    },
        frame: {
            duration: 300
        }
    });
}

function updateColor(){
    value = $( "#chooseColorSelect" ).val();
    console.log(value)
    let index = jsonData.colorOptions[value].index;
    let colors = [];
    for(item of dataShuffled){
        colors.push(item[index]);
    }
    var update = {
        marker: {
            color: colors,
            size: 5,
            symbol: 'circle',
            opacity: 0.9
        }
    };
    Plotly.restyle( "graphContainer", update );
}


function createCheckboxes(){
    let target = $( "#dataOptions" );
    target.empty();
    let keys = Object.keys( jsonData.dataOptions );
    for (key of keys){
        target.append( createCheckboxOption( key + "Checkbox", key.replaceAll( "_", " ") ) );
    }
}

function createCheckboxOption( id, text ){
    let template = document.createElement( 'template' );
    let htmlString = `<div class="checkboxsWrapperDiv"><input type="checkbox" checked="true" id="${ id }"><label>${ text }</label></div>`;
    htmlString = htmlString.trim()
    template.innerHTML = htmlString;
    return template.content.firstChild;
}

function createColors(){
    let target = $( "#chooseColorSelect" )
    target.empty();
    let keys = Object.keys( jsonData.colorOptions );
    for (key of keys){
        target.append( createColorOption( key, key.replaceAll( "_", " ") ) );
    }
}

function createColorOption( value, text ){
    let template = document.createElement( 'template' );
    let htmlString = `<option value="${ value }">${ text }</option>`
    htmlString = htmlString.trim()
    template.innerHTML = htmlString;
    return template.content.firstChild;
}
