class Cat {
    constructor(room, id, cords, grade, startRotate, timeout, step, energy, side) {
        this.room = room;
        this.id = id;
        this.cords = cords;
        this.grade = grade;
        this.startRotate = startRotate;
        this.timeout = timeout;
        this.step = step;
        this.energy = energy;
        this.side = side;
    }
};
    
module.exports = { Cat }; 