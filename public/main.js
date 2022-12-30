const socket = io();

let id = 1;
let tds = document.querySelectorAll('td');
let rotate = {};
let rotating = true;

function newCat(x, energy) {
    let cat = document.createElement('div');
    cat.className = 'cat';
    let arrowBase = document.createElement('div');
    arrowBase.className = 'arrowBase';
    cat.append(arrowBase);
    let arrow = document.createElement('div');
    arrow.className = 'arrow';
    let green = document.createElement('div');
    let red = document.createElement('div');
    green.className = 'green';
    red.className = 'red';
    green.style.height = `${60 * energy}px`;
    red.style.height = `${60 * (1 - energy)}px`;
    arrow.append(green);
    arrow.append(red);
    arrowBase.append(arrow);
    let arrowEnd = document.createElement('div');
    arrowEnd.className = 'arrowEnd';
    arrowBase.append(arrowEnd);
    tds[x].append(cat);
};

//socket.emit('addCat');

socket.on('regenerate', (result) => {
    for (let i = 0; i < result.length; i++) {
        let cat = tds[(result[i].y - 1) * 10 + (result[i].x - 1)];
        cat = cat.children[0].children[0].children[0];
        cat.children[0].style.height = `${60 * result[i].energy}px`;
        cat.children[1].style.height = `${60 * (1 - result[i].energy)}px`;
    };
});

socket.emit('initialize', id);
socket.on('initialize', (result) => {
    for (let i = 0; i < result.length; i++) {
        newCat((result[i].y - 1) * 10 + (result[i].x - 1), result[i].energy);
        let whatToRotate = tds[(result[i].y - 1) * 10 + (result[i].x - 1)].children[0].children[0];
        whatToRotate.style.transform = `rotate(${result[i].grade}deg)`;
    };
});

function parseCode(string) {
    return string.match(/[A-Z]/g)[1].toLowerCase();
};

document.addEventListener('keydown', () => {
    let key = parseCode(event.code);
    if (['w', 'a', 's', 'd', 'q', 'e', 'z', 'x'].includes(key)) {
        socket.emit('moving', id, key);
    } else if (['j', 'l'].includes(key)) {
        if (rotating == true) {
            rotating = false;
            socket.emit('rotating', id, key);
        };
    } else if (key === 'i') {
        socket.emit('attack', id);
    } else if (key === 'k') {

    };
});

document.addEventListener('keyup', () => {
    let key = parseCode(event.code);
    if (['j', 'l'].includes(key)) {
        rotating = true;
        socket.emit('stop rotating', id);
    };
});

socket.on('moving', (result) => {
    if (result !== null) {
        tds[(result.old.y - 1) * 10 + (result.old.x - 1)].children[0].remove();
        newCat((result.new.y - 1) * 10 + (result.new.x - 1), result.energy);
        let whatToRotate = tds[(result.new.y - 1) * 10 + (result.new.x - 1)].children[0].children[0];
        let arrowGrade;
        result.grade = parseInt(result.grade);
        console.log(result.grade);
        if (result.side === '0') {
            arrowGrade = result.grade;
        } else {
            if (result.side === 'l') {
                arrowGrade = (result.grade + ((Date.now() - result.start) / 50 * 2)) % 360;
                console.log(Date.now(), result.start);
            } else {
                arrowGrade = result.grade - ((Date.now() - result.start) / 50 * 2);
                if (arrowGrade <= 0) {
                    arrowGrade = 360 - Math.abs(arrowGrade) % 360;
                };
                console.log(Date.now() / 1000 / 60 % 60, Date.now() / 1000 % 60);
            };
        };
        whatToRotate.style.transform = `rotate(${arrowGrade}deg)`;
        socket.emit('cooldown', result.id, result.key, arrowGrade);
        if (rotate[id] !== undefined) {
            clearInterval(rotate[id]);
            delete rotate[id];
            socket.emit('newRotating', id);
        };
    };
});

socket.on('rotating', async (result) => {
    if (rotate[id] === undefined) {
        rotate[id] = setInterval(() => {
            let whatToRotate = tds[(result.y - 1) * 10 + (result.x - 1)].children[0].children[0];
            let grade = parseInt(whatToRotate.style.transform.match(/[0-9]{1,3}/)[0]);
            if (result.side === 'l') {
                grade += 2;
                if (grade >= 360) {
                    grade = 0;
                };
            } else {
                grade -= 2;
                if (grade <= 0) {
                    grade = 360;
                };
            };
            whatToRotate.style.transform = `rotate(${grade}deg)`;
        }, 50);
    };
});

socket.on('stop rotating', (result) => {
    clearInterval(rotate[id])
    delete rotate[id];
});

socket.on('attack', (result) => {
    try {
        let cat = tds[(result.y - 1) * 10 + (result.x - 1)];
        cat = cat.children[0].children[0].children[0];
        cat.children[0].style.height = `${60 * result.energy}px`;
        cat.children[1].style.height = `${60 * (1 - result.energy)}px`;
    } catch {};
});