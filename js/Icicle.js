/**
 * Created by Lukáš on 19-Feb-17.
 */
var labelType, useGradients, nativeTextSupport, animate;

(function () {
    var ua = navigator.userAgent,
        iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
        typeOfCanvas = typeof HTMLCanvasElement,
        nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
        textSupport = nativeCanvasSupport
            && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
    //I'm setting this based on the fact that ExCanvas provides text support for IE
    //and that as of today iPhone/iPad current text support is lame
    labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? 'Native' : 'HTML';
    nativeTextSupport = labelType == 'Native';
    useGradients = nativeCanvasSupport;
    animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
    elem: false,
    write: function (text) {
        if (!this.elem)
            this.elem = document.getElementById('log');
        this.elem.innerHTML = text;
        this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
    }
};


var icicle;

function loadData(path) {
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': path,
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
}

function setHeight(value) {
    var phones = document.getElementById('phones');
    var leftC = document.getElementById('left-container');
    var centerC = document.getElementById('center-container');
    var rightC = document.getElementById('right-container');

    phones.style.height = value + 'px';
    leftC.style.height = value + 'px';
    centerC.style.height = value + 'px';
    rightC.style.height = value + 'px';

    var width = icicle.canvas.getSize().width;
    icicle.canvas.resize(width, value);
}

function recomputeHeight() {
    var adjacency = icicle.clickedNode.getAdjacency(icicle.json.id);
    if (adjacency != null && adjacency.nodeTo.id == icicle.json.id ) {
        var height = icicle.json.children.length * 20;
        setHeight(height > 600 ? height : 600);
    }
}

function init() {
    // left panel controls
    controls();
    // $jit.id('max-levels').style.display = 'none';
    // init data
    // var json = jQuery.getJSON("data/brandTree.json", function(json) {
    //     console.log(json); // this will show the info it in firebug console
    // });
    var json = loadData("data/brandTree5.json");
    // end

    // init Icicle
    icicle = new $jit.Icicle({
        // id of the visualization container
        injectInto: 'phones',
        // whether to add transition animations
        animate: animate,
        // nodes offset
        offset: 1,
        // whether to add cushion type nodes
        cushion: true,
        // do not show all levels at once
        constrained: true,
        levelsToShow: 4,
        // enable tips
        Tips: {
            enable: true,
            type: 'Native',
            // add positioning offsets
            offsetX: 20,
            offsetY: 10,
            // implement the onShow method to
            // add content to the tooltip when a node
            // is hovered
            onShow: function (tip, node) {
                // count children
                var count = 0;
                node.eachSubnode(function () {
                    count++;
                });
                // add tooltip info
                tip.innerHTML = "<div class=\"tip-title\"><b>Name:</b> "
                    + node.name + "</div><div class=\"tip-text\">" + count
                    + " children</div>";
            }
        },
        // Add events to nodes
        Events: {
            enable: true,
            onClick: function (node) {
                if (node) {
                    //hide tips
                    icicle.tips.hide();
                    if (icicle.clickedNode.id != icicle.json.id) {
                        setHeight(600);
                    }
                    // perform the enter animation
                    icicle.enter(node);
                }
            },
            onRightClick: function () {
                //hide tips
                icicle.tips.hide();
                // perform the out animation
                jQuery.when(icicle.out()).then(recomputeHeight());
            }
        },
        // Add canvas label styling
        Label: {
            type: labelType, // "Native" or "HTML"
            color: '#170d0b',
            style: 'bold',
            size: 12
        },
        // Add the name of the node in the corresponding label
        // This method is called once, on label creation and only for DOM and
        // not
        // Native labels.
        onCreateLabel: function (domElement, node) {
            domElement.innerHTML = node.name;
            var style = domElement.style;
            style.fontSize = '0.9em';
            style.display = '';
            style.cursor = 'pointer';
            style.color = '#333';
            style.overflow = 'hidden';
        },
        // Change some label dom properties.
        // This method is called each time a label is plotted.
        onPlaceLabel: function (domElement, node) {
            var style = domElement.style, width = node.getData('width'), height = node
                .getData('height');
            if (width < 7 || height < 7) {
                style.display = 'none';
            } else {
                style.display = '';
                style.width = width + 'px';
                style.height = height + 'px';
            }
        }
    });
    // load data
    icicle.loadJSON(json);
    // compute positions and plot
    icicle.refresh();
    //end
}

//init controls
function controls() {
    var jit = $jit;
    var gotoparent = jit.id('update');
    jit.util.addEvent(gotoparent, 'click', function () {
        jQuery.when(icicle.out()).then(recomputeHeight());
    });
    var select = jit.id('s-orientation');
    jit.util.addEvent(select, 'change', function () {
        icicle.layout.orientation = select[select.selectedIndex].value;
        icicle.refresh();
    });
    var levelsToShowSelect = jit.id('i-levels-to-show');
    jit.util.addEvent(levelsToShowSelect, 'change', function () {
        var index = levelsToShowSelect.selectedIndex;
        if (index == 0) {
            icicle.config.constrained = false;
        } else {
            icicle.config.constrained = true;
            icicle.config.levelsToShow = index;
        }
        icicle.refresh();
    });
    var data = jit.id('k-data-to-show');
    jit.util.addEvent(data, 'change', function () {
        var index = data.selectedIndex;
        var json = null;
        switch (index) {
            case 0 :
                json = loadData("data/brandTree5.json");
                setHeight(600);
                break;
            case 1 :
                json = loadData("data/brandTree100.json");
                setHeight(json.children.length * 20);
                break;
            case 2 :
                json = loadData("data/brandTree1000.json");
                setHeight(json.children.length * 20);
                break;
            case 3 :
                json = loadData("data/brandTree.json");
                setHeight(json.children.length * 20);
                break;
        }
        icicle.loadJSON(json);
        icicle.refresh();
    })
}
//end
