const db = require('../database');

async function findRoom(id) {
    let room = await db.query('SELECT room FROM cats WHERE id = $1', [id]);
    return room.rows[0].room;
};

async function findPoint(id) {
    let point = await db.query('SELECT x, y FROM cats WHERE id = $1', [id]);
    return {'x': point.rows[0].x, 'y': point.rows[0].y};
};

function convert(old) {
    if (old >= 90) {
        old -= 90;
    } else {
        old = 360 - old;
    }
    return old;
};

class Actions {
    async init(id) {
        let room = await findRoom(id);
        let points = await db.query('SELECT x, y, grade, energy FROM cats WHERE room = $1', [room]);
        let result = [];
        for (let i = 0; i < points.rows.length; i++) {
            result.push({'x': points.rows[i].x, 'y': points.rows[i].y, 'grade': points.rows[i].grade, 'energy': points.rows[i].energy});
        };
        return result;
    };
    async move(id, key) {
        let cells = await db.query('SELECT x, y, timeout, step, startrotate, grade, side, energy FROM cats WHERE id = $1', [id]);
        if (parseInt(cells.rows[0].step) + parseInt(cells.rows[0].timeout) < Date.now()) {
            let oldCell = {'x': cells.rows[0].x, 'y': cells.rows[0].y};
            let newCell = {'x': cells.rows[0].x, 'y': cells.rows[0].y};
            if (['q', 'w', 'e'].includes(key)) {
                newCell.y -= 1
            } else if (['z', 'x', 's'].includes(key)) {
                newCell.y += 1
            };
            if (1 > newCell.y || newCell.y > 6) {
                newCell.y = oldCell.y;
            };
            if (['q', 'a', 'z'].includes(key)) {
                newCell.x -= 1
            } else if (['e', 'd', 'x'].includes(key)) {
                newCell.x += 1
            };
            if (1 > newCell.x || newCell.x > 10) {
                newCell.x = oldCell.x;
            };
            if (JSON.stringify(oldCell) !== JSON.stringify(newCell)) {
                let room = await findRoom(id);
                let check = await db.query('SELECT * FROM cats WHERE x = $1 AND y = $2 AND room = $3', [newCell.x, newCell.y, room]);
                if (!check.rows.length) {
                    await db.query('UPDATE cats SET x = $1, y = $2, step = $3 WHERE id = $4', [newCell.x, newCell.y, Date.now(), id]);
                    return {'id': id, 'key': key, 'old': oldCell, 'new': newCell, 'start': cells.rows[0].startrotate, 'grade': cells.rows[0].grade, 'side': cells.rows[0].side, 'energy': cells.rows[0].energy};
                };
            };
        };
    };
    async rotate(id, key) {
        let point = await findPoint(id);
        await db.query('UPDATE cats SET startrotate = $1, side = $2 WHERE id = $3', [Date.now(), key, id]);
        return {'id': id, 'x': point.x, 'y': point.y, 'side': key};
    };
    async stopRotate(id) {
        let point = findPoint(id);
        let result = await db.query('SELECT startrotate, side, grade FROM cats WHERE id = $1', [id]);
        let arrowGrade;
        if (result.rows[0].side === 'l') {
            arrowGrade = (parseInt(result.rows[0].grade) + ((Date.now() - result.rows[0].startrotate) / 50 * 2)) % 360;
        } else {
            arrowGrade = parseInt(result.rows[0].grade) - ((Date.now() - result.rows[0].startrotate) / 50 * 2);
            if (arrowGrade <= 0) {
                arrowGrade = 360 - Math.abs(arrowGrade) % 360;
            };
        };
        await db.query('UPDATE cats SET side = $1, grade = $2 WHERE id = $3', ['0', arrowGrade, id]);
        return {'x': point.x, 'y': point.y};
    };
    async newRotate(id) {
        let point = await findPoint(id);
        let side = await db.query('SELECT side FROM cats WHERE id = $1', [id]);
        side = side.rows[0].side;
        return {'id': id, 'x': point.x, 'y': point.y, 'side': side};
    }
    async cooldown(id, key, grade) {
        let zero;
        switch(key) {
            case 'w':
                zero = 180;
                break;
            case 's':
                zero = 0;
                break;
            case 'a':
                zero = 90;
                break;
            case 'd':
                zero = 270;
                break;
            case 'q':
                zero = 150;
                break;
            case 'e':
                zero = 200;
                break;
            case 'z':
                zero = 40;
                break;
            case 'x':
                zero = 330;
                break;
        };
        let c = Math.abs(zero - grade);
        if (c > 180) {
            c = 360 - c;
        };
        if (c < 90 && ['w', 'a', 's', 'd'].includes(key)) {
            c = 50;
        } else {
            c = c / 180 * 1700;
        };
        await db.query('UPDATE cats SET timeout = $1 WHERE id = $2', [c, id]);
    };
    async attack(id) {
        let possiblity = await db.query('SELECT side, grade, x, y FROM cats WHERE id = $1', [id]);
        let grade = convert(parseInt(possiblity.rows[0].grade));
        let position = {x: possiblity.rows[0].x, y: possiblity.rows[0].y};
        let point;
        let damage = 0;
        if (possiblity.rows[0].side === '0') {
            if (235 <= grade && grade <= 250) {
                point = 'морда';
                position.y += 1;
                position.x += 1;
            } else if (250 <= grade && grade <= 290) {
                point = 'морда';
                position.y += 1;
            } else if (290 <= grade && grade <= 300) {
                point = 'морда';
                position.y += 1;
                position.x -= 1;
            } else if (130 <= grade && grade <= 235) {
                if (130 <= grade && grade <= 159) {
                    point = 'морда';
                } else if (159 <= grade && grade <= 164) {
                    point = 'горло';
                } else if (164 <= grade && grade <= 185) {
                    point = 'живот';
                } else if (185 <= grade && grade <= 235) {
                    point = 'лапы';
                };
                position.x += 1;
            } else if (300 <= grade || grade <= 40) {
                if (300 <= grade && grade <= 325) {
                    point = 'хвост';
                } else if (325 <= grade || grade <= 16) {
                    point = 'спина';
                } else if (16 <= grade && grade <= 21) {
                    point = 'шея';
                } else if (21 <= grade && grade <= 40) {
                    point = 'морда';
                };
                position.x -= 1;
            } else if (110 <= grade && grade <= 120) {
                point = 'лапы';
                position.y -= 1;
                position.x -= 1;
            } else if (65 <= grade && grade <= 110) {
                point = 'хвост';
                position.y -= 1;
            } else if (40 <= grade && grade <= 65) {
                point = 'хвост';
                position.y -= 1;
                position.x += 1;
            };
        };
        let target = await db.query('SELECT energy FROM cats WHERE x = $1 AND y = $2', [position.x, position.y]);
        if (target.rows.length === 1) {
            if (point === 'горло') {
                damage = 0.4;
            } else if (point === 'шея') {
                damage = 0.3;
            } else if  (point === 'живот') {
                damage = 0.2;
            } else if (point === 'морда') {
                damage = 0.18;
            } else if (point === 'спина') {
                damage = 0.1;
            } else if (point === 'лапы') {
                damage = 0.07;
            } else if (point === 'хвост') {
                damage = 0.04;
            };
            await db.query('UPDATE cats SET energy = $1 WHERE x = $2 AND y = $3', [parseFloat(target.rows[0].energy) - damage, position.x, position.y]);
            return {x: position.x, y: position.y, energy: parseFloat(target.rows[0].energy) - damage}
        };
    };
    async regenerate() {
        let bited = await db.query('SELECT id, x, y, energy FROM cats WHERE energy < 1;');
        let bitedList = []
        for (let i = 0; i < bited.rows.length; i++) {
            let energy = bited.rows[i].energy;
            energy = parseFloat(energy) + 0.15;
            if (energy > 1) {
                energy = 1;
            };
            bitedList.push({x: bited.rows[i].x, y: bited.rows[i].y, energy: energy});
            await db.query('UPDATE cats SET energy = $1 WHERE id = $2', [energy, bited.rows[i].id]);
        };
        return bitedList;
    };
    async addCat() {
        let busy = await db.query('SELECT x, y FROM cats');
        let point;
        let end = false;
        for (let i = 0; i < 60; i++) {
            for (let j = 0; j < busy.rows.length; j++) {
                if (i + 1 === busy.rows[j].y * 10 + busy.rows[j].x) {
                    end = true;
                };
            };
            if (end === true) {
                end = false;
            } else {
                point = {x: i % 10 + 1, y: parseInt((i + 1) / 6 + 1)};
                break;
            };
        };
        await db.query('INSERT INTO cats (room, x, y, grade, timeout, step, energy, side) VALUES (1, $1, $2, 0, 0, 1, 1, 0)', [point.x, point.y]);
    };
};

module.exports = new Actions;