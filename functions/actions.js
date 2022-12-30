const { Cat } = require('../database');

class CatsManager {
    static _cats = new Map();
    static lastId = 1;
    static newCat(cords) {
        const cat = new Cat(1, CatsManager.lastId, {x: 1, y: 1}, 0, 0, 0, 0, 1, '0');
        CatsManager._cats.set(CatsManager.lastId, cat);
        CatsManager.lastId++;
        return cat;
    }
    static oneRoom(room) {
        let oneRoomCats = [];
        for (let i = 0; i < CatsManager._cats.size; i++) {
            oneRoomCats.push(CatsManager.get(i + 1));
        };
        return oneRoomCats;
    }

    static set(id, key) {
        return CatsManager._cats.set(id, key);
    }

    static get(id) {
        return CatsManager._cats.get(id);
    }

    static thereIsCat(cords, room) {
        for (let i = 0; i < CatsManager._cats.size; i++) {
            let cat = CatsManager.get(i + 1);
            if (cat.cords.x === cords.x && cat.cords.y === cords.y && cat.room === room) {
                return false;
            };
            return true;
        }
    }

    static attack(cords) {
        for (let i = 0; i < CatsManager._cats.size; i++) {
            let cat = CatsManager.get(i + 1);
            console.log(cords);
            if (cat.cords.x === cords.x && cat.cords.y === cords.y) {
                return cat.id;
            }
        }
        return -1;
    }
}

CatsManager.newCat({x: 1, y: 1});

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
        let room = CatsManager.get(id).room;
        let points = CatsManager.oneRoom(room);
        let result = [];
        for (let i = 0; i < points.length; i++) {
            result.push({'x': points[i].cords.x, 'y': points[i].cords.y, 'grade': points[i].grade, 'energy': points[i].energy});
        };
        return result;
    };
    async move(id, key) {
        let cells = CatsManager.get(id);
        if ((cells.step + cells.timeout) < Date.now()) {
            let oldCell = {'x': cells.cords.x, 'y': cells.cords.y};
            let newCell = {'x': cells.cords.x, 'y': cells.cords.y};
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
                let info = CatsManager.get(id);
                let check = CatsManager.thereIsCat(newCell, info.room);
                if (check) {
                    info.cords = newCell;
                    info.step = Date.now();
                    return {'id': info.id, 'key': key, 'old': oldCell, 'new': newCell, 'start': info.startRotate, 'grade': info.grade, 'side': info.side, 'energy': info.energy};
                };
            };
        };
    };
    async rotate(id, key) {
        let point = CatsManager.get(id);
        point.startRotate = Date.now();
        point.side = key;
        CatsManager.set(id, point);
        return {'id': id, 'x': point.cords.x, 'y': point.cords.y, 'side': key};
    };
    async stopRotate(id) {
        let point = CatsManager.get(id);
        let arrowGrade;
        if (point.side === 'l') {
            arrowGrade = parseInt(point.grade + ((Date.now() - point.startRotate) / 50 * 2)) % 360;
        } else {
            arrowGrade = parseInt(point.grade) - ((Date.now() - point.startRotate) / 50 * 2);
            if (arrowGrade <= 0) {
                arrowGrade = 360 - Math.abs(arrowGrade) % 360;
            };
        };
        point.side = '0';
        console.log(arrowGrade);
        point.grade = arrowGrade;
        CatsManager.set(id, point);
        return {'x': point.cords.x, 'y': point.cords.y};
    };
    async newRotate(id) {
        let point = CatsManager.get(id);
        return {'id': id, 'x': point.cords.x, 'y': point.cords.y, 'side': point.side};
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
        let info = CatsManager.get(id);
        info.timeout = c;
        CatsManager.set(id, info);
    };
    async attack(id) {
        let possiblity = CatsManager.get(id);
        let grade = convert(possiblity.grade);
        let position = {x: possiblity.cords.x, y: possiblity.cords.y};
        let point;
        let damage = 0;
        if (possiblity.side === '0') {
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
        let target = CatsManager.attack(position);
        let info = CatsManager.get(id);
        console.log(target, target === -1);
        if (target !== -1) {
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
            info.energy -= damage;
            CatsManager.set(target, info);
            return {x: position.x, y: position.y, energy: info.energy}
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