function mutate(x)
{
    if(random(1) < 0.1)
    {
        let offset = randomGaussian() * 0.5;
        let newX = x + offset;
        return newX;
    }
    else
        return x;
}

class Car
{
	constructor(x, y, spots, brain)
	{
		this.sprite;
		
		this.sensors = [];
        this.activatedSensors = [];
        this.activatedSensors.fill(-1, -1, -1, -1)
		
		this.acceleration = 0;
		
		this.blocked = false;
		this.parked = false;
		this.loop = true;
		
		this.wMin = -650;
		this.wMax = 1120;
		
		this.hMax = 1450;
        
        this.fitness = 0;
        this.score = 0;
		
        if(brain)
        {
            this.brain = brain.copy();
            this.brain.mutate(mutate);
        }
        else
            this.brain = new NeuralNetwork(10, 10, 4);
        
        this.target = this.chooseSpot(spots);
		
		this.createSprite(x, y);
	}
	
	createSprite(x, y)
	{
		const carImage = loadImage("./assets/car.png");
		
		this.sprite = createSprite(x, y);
		this.sprite.addImage("normal", carImage);
		
		this.sprite.maxSpeed = 100000;
		this.sprite.friction = .98;
		this.sprite.scale = 0.2;
		
		this.sensors[0] = createVector(this.sprite.position.x + this.sprite.width / 2, this.sprite.position.y + this.sprite.height / 2);
		this.sensors[1] = createVector(this.sprite.position.x + this.sprite.width / 2, this.sprite.position.y - this.sprite.height / 2);
		this.sensors[2] = createVector(this.sprite.position.x - this.sprite.width / 2, this.sprite.position.y + this.sprite.height / 2);
		this.sensors[3] = createVector(this.sprite.position.x - this.sprite.width / 2, this.sprite.position.y - this.sprite.height / 2);
	}
	
	think(spot)
	{		
		let inputs = [];
		inputs[0] = (this.sensors[0].x - this.wMin) / (-this.wMin + this.wMax);
		inputs[1] = this.sensors[0].y / this.hMax;
		inputs[2] = (this.sensors[1].x - this.wMin) / (-this.wMin + this.wMax);
		inputs[3] = this.sensors[1].y / this.hMax;
		inputs[4] = (this.sensors[2].x - this.wMin) / (-this.wMin + this.wMax);
		inputs[5] = this.sensors[2].y / this.hMax;
		inputs[6] = (this.sensors[3].x - this.wMin) / (-this.wMin + this.wMax);
		inputs[7] = this.sensors[3].y / this.hMax;
		inputs[8] = (spot.sprite.position.x - this.wMin) / (-this.wMin + this.wMax);
		inputs[9] = spot.sprite.position.y / this.hMax;
		
		let outputs = this.brain.predict(inputs);
		
		if(outputs[0] > 0.5)
			this.goForward();
		if(outputs[1] > 0.5)
			this.goRight();
		if(outputs[2] > 0.5)
			this.goBackward();
		if(outputs[3] > 0.5)
			this.goLeft();
	}
	
	chooseSpot(spots)
	{
		for(let i = 0; i < spots.length; i++)
			if(spots[i].available)
				return spots[i];
	}
    
    distToSpot(spot)
    {
        let dX = abs(((this.sprite.position.x - spot.sprite.position.x) - this.wMin) / (-this.wMin + this.wMax));
        let dY = abs((this.sprite.position.y - spot.sprite.position.y) / this.hMax);
        
        let d = dX + dY;
        
        return d;
    }
	
	checkBlocked(walls)
	{
		if(this.sprite.collide(walls))
			this.blocked = true;
	}
	
	checkCollision(cars)
	{
		for(let i = 0; i < cars.length; i++)
		{
			if(this.sprite.collide(cars[i].sprite))
				this.blocked = true;
		}
	}
	
	checkUnavailableSpot(spots)
	{
		for(let i = 0; i < spots.length; i++)
            if(!spots[i].available && this.sprite.collide(spots[i].sprite))
				this.blocked = true;
	}
    
    checkSensors(spots)
	{
        for(let i = 0; i < this.sensors.length; i++)
        {
            for(let j = 0; j < spots.length; j++)
            {
                if(spots[j].sprite.overlapPoint(this.sensors[i].x, this.sensors[i].y))
                {
                    this.activatedSensors[i] = j;
                    break;
                }
                else
                    this.activatedSensors[i] = -1;
            }
        }
	}
	
	showSensors()
	{
		strokeWeight(5);
        for(let i = 0; i < this.sensors.length; i++)
        {
            if(this.activatedSensors[i] !== -1)
            {
                push();
                stroke(127, 0, 0);
                point(this.sensors[i].x, this.sensors[i].y);
                pop();
            }
            else
            {
                push();
                stroke(0, 0, 0);
                point(this.sensors[i].x, this.sensors[i].y);
                pop();
            }
        }            
	}
    
    checkParked()
	{
        let spot = this.activatedSensors[0];
        if(spot !== -1)
        {
            for(let i = 1; i < this.sensors.length; i++)
                if(this.activatedSensors[i] === -1 || spot !== this.activatedSensors[i])
                    return;
        }
        else
            return;
        
        this.parked = true;
	}
	
	goLeft() 		{ this.sprite.rotation -= 2; }
	goRight()		{ this.sprite.rotation += 2; }
	goBackward() 	{ this.acceleration -= 3; }
	goForward()		{ this.acceleration += 3; }
    
    /* TODO: trouver bonne fonction pour adapter le score en fonction de la distance a la place */
    setScore(x)
    {
        this.score += (1 / Math.sqrt(2 * PI) * Math.exp((-x * x) / 2));
    }
	
	move(walls, spots, carsGroup1, carsGroup2)
	{		
		this.checkBlocked(walls);
		this.checkCollision(carsGroup1);
		this.checkCollision(carsGroup2);
		this.checkUnavailableSpot(spots);
		
        this.checkSensors(spots);
        this.showSensors();
		
        this.checkParked();
		
		if(!this.blocked && !this.parked)
		{			
			
            this.think(this.target);
            this.setScore(this.distToSpot(this.target));
			
			if(this.acceleration > 0)   
				this.acceleration -= 1.5;
			if(this.acceleration < 0)   
				this.acceleration += 1.5;
				
			/* TODO: ameliorer ca et le timer */
            if(this.acceleration > 0 || this.sprite.velocity > 0)
				this.loop = false;
			else
				this.loop = true;
			
			this.sprite.addSpeed(this.acceleration, this.sprite.rotation);
            
            let a = radians(this.sprite.rotation);
            this.sensors[0] = createVector(this.sprite.position.x + 60 * cos(a + PI / 6), this.sprite.position.y + 60 * sin(a + PI / 6));
            this.sensors[1] = createVector(this.sprite.position.x + 60 * cos(a + (5 * PI) / 6), this.sprite.position.y + 60 * sin(a + (5 * PI) / 6));
            this.sensors[2] = createVector(this.sprite.position.x + 60 * cos(a + (7 * PI) / 6), this.sprite.position.y + 60 * sin(a + (7 * PI) / 6));
            this.sensors[3] = createVector(this.sprite.position.x + 60 * cos(a + (11 * PI) / 6), this.sprite.position.y + 60 * sin(a + (11 * PI) / 6));
		}
	}
}
