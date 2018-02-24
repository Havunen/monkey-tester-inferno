var elementsWithClick = [];

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

var loop = null;

var wrapper = document.createElement('div');

function updateErrorWrapper() {
    wrapper.innerHTML = '<div style="position: fixed;' +
        'top: 50%;' +
        'margin-top: -250px;' +
        'width: 500px;' +
        'height: 500px;' +
        'margin-left: -250px;' +
        'left: 50%;' +
        'z-index: 9999999;' +
        'background: #fff;' +
        'border: 2px solid #ccc;' +
        'padding: 100px;' +
        'border-radius: 3px;"><img width="200" height="200" src="https://cdn4.iconfinder.com/data/icons/security-overcolor/512/bug-512.png"/><h1>Reporting JS excetion to Raygun</h1>'
}

function stopMonkey() {
    clearInterval(loop);
    loop = null;
}

window.addEventListener('error', function() {
    stopMonkey();
    document.body.appendChild(wrapper);

    // console.info("POST TO RAYGUN");

    // if (!process.env.TEST && process.env.NODE_ENV === 'production') {
    //     window.rg4js('send', {
    //         error: errorEvent,
    //         customData: [{'tester-monkey': 'tester-monkey'}]
    //     });
    // }

    updateErrorWrapper();

    setTimeout(function () {
        document.body.removeChild(wrapper);
        window.location.reload(true);
    }, 10000)
});

function showItsClickPoint(x, y) {
    var fragment = document.createDocumentFragment();
    var touchSignal = document.createElement('div');
    touchSignal.style.zIndex = 2000;
    touchSignal.style.background = "red";
    touchSignal.style['border-radius'] = '50%'; // Chrome
    touchSignal.style.borderRadius = '50%';     // Mozilla
    touchSignal.style.width = "20px";
    touchSignal.style.height = "20px";
    touchSignal.style.position = "absolute";
    touchSignal.style.webkitTransition = 'opacity .5s ease-out';
    touchSignal.style.mozTransition = 'opacity .5s ease-out';
    touchSignal.style.transition = 'opacity .5s ease-out';
    touchSignal.style.left = (x + 10) + 'px';
    touchSignal.style.top = (y + 10) + 'px';

    var element = fragment.appendChild(touchSignal);
    setTimeout(function() {
        document.body.removeChild(element);
    }, 500);
    setTimeout(function() {
        element.style.opacity = 0;
    }, 50);
    document.body.appendChild(fragment);
}

function simulateClick(elem) {
    // Create our event (with options)
    var evt = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    // If cancelled, don't dispatch our event

    console.log("CLICK ON " + elem.outerHTML);
    elem.dispatchEvent(evt);
}

var confirmDialogRoot = null;
var modalRoot = null;

function doSomething() {
    var itemsToClick;
    confirmDialogRoot = confirmDialogRoot || document.querySelector('.confirmation-popup.popup-bg');
    modalRoot = modalRoot || document.querySelector('.popup-bg');

    if (confirmDialogRoot && confirmDialogRoot.children.length !== 0) {
        // If there is confirm dialog we want the Monkey to click onthat because that is more to close to real user experience
        var mandatoryItems = [];

        analyzeDOM(confirmDialogRoot, mandatoryItems);
        itemsToClick = mandatoryItems;
    } else if (modalRoot && modalRoot.children.length !== 0) {
        // If there is modal we make it mandatory
        var mandatoryItems = [];

        analyzeDOM(modalRoot, mandatoryItems);
        itemsToClick = mandatoryItems;
    } else {
        itemsToClick = elementsWithClick;
    }

    if (itemsToClick.length === 0) {
        return;
    }

    var index = getRandomInt(itemsToClick.length - 1);

    var element = itemsToClick[index];

    // Ignore external links
    if (!element.rel && element.id !== 'logout' && !element.disabled) {
        var rect = element.getBoundingClientRect();

        showItsClickPoint(rect.x, rect.y);
        simulateClick(element);
    }
}


function analyzeDOM (root, array) {
    if (root.nodeType !== 1) {
        return;
    }
    var items = root.getElementsByTagName("*");

    for (var i = items.length; i--;) {
        var node = items[i];

        if (node.tagName !== 'A' && node.$EV && node.$EV.onClick) {
            array.push(node);
        }
    }
}


var startedOnce = false;

function speedChange(input) {
    window.monkey.speed = Number(input.value);
}

function startMonkey() {
    if (loop !== null) {
        return;
    }
    var root = document.getElementById('app');

    // Options for the observer (which mutations to observe)
    var config = { childList: true, subtree: true };
    var j = 0;
    var i = 0;

    // Callback function to execute when mutations are observed
    var callback = function(mutationsList) {
        for (i = 0; i < mutationsList.length; i++) {
            var mutation = mutationsList[i];

            for (j = 0; j < mutation.addedNodes.length; j++) {
                var node1 = mutation.addedNodes[j];

                analyzeDOM(node1, elementsWithClick);
            }

            for (j = 0; j < mutation.removedNodes.length; j++) {
                var node2 = mutation.removedNodes[j];
                if (node2.nodeType !== 1) {
                    continue;
                }
                var items = node2.getElementsByTagName("*");

                for (var i = items.length; i--;) {
                    var node = items[i];
                    if (!node.$EV || node.tagName === 'A') {
                        continue;
                    }
                    var index = elementsWithClick.indexOf(node);

                    if (index > -1) {
                        elementsWithClick.splice(index, 1);
                    }
                }
            }
        }
    };

    // Create an observer instance linked to the callback function
    var observer = new MutationObserver(callback);

    analyzeDOM(root, elementsWithClick);
    // Start observing the target node for configured mutations
    observer.observe(root, config);

    console.log("STARTING MONKEY");

    if (!startedOnce) {
        var d = document.createElement('div');

        d.style.cssText = 'position: fixed; bottom: 0; right: 0; z-index: 999';
        d.innerHTML = '<button onclick="window.monkey.stopMonkey()">Stop Monkey!</button>' +
            '<button onclick="window.monkey.startMonkey()">Start Monkey</button>' +
            '<input value="200" oninput="window.monkey.speedChange(this)" type="number"/>';

        document.body.appendChild(d);
    }

    startedOnce = true;

    loop = setInterval(doSomething, window.monkey.speed);
}

window.monkey = {
    speed: 200,
    startMonkey: startMonkey,
    stopMonkey: stopMonkey,
    speedChange: speedChange
};
