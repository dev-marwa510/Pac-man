const canvas = document.querySelector('canvas')  //querySelector erlaubt irgendeine element im HTML anzugreifen -->wird dann 'canvas' gewählt
const c = canvas.getContext('2d') //greift auf den 2D-Zeichenkontext eines HTML-Element zu....2D wird als String verwendet
const scoreEl = document.querySelector('#scoreEl')

//Elemente aus dem HTML-Dokument auswählen
const backgroundMusic = document.getElementById('backgroundMusic')
const winMusic = document.getElementById('winMusic')
const loseMusic = document.getElementById('loseMusic')
const eatingSound = document.getElementById('eatingSound')

canvas.width = window.innerWidth                      //Die Breite des Canvas auf die Breite des Browserfensters anzupassen
canvas.height = window.innerHeight                    //Das Gleiche für die Höhe

class Boundary {
    static width = 40                                 //statische Eigenschaft (die 40 bei switch case zu erstezen)
    static height = 40
    constructor({ position, image }) {                //jeder Boundary ist ein Quadrat
        this.position = position
        this.width = 40
        this.height = 40
        this.image = image
    }
    draw() {                                        // Wird zeigen, wie ein Boundary aussieht
        /*
            c.fillStyle = 'blue'
            c.fillRect(this.position.x, this.position.y, this.width, this.height)
        */
        //wir brauchen das nicht mehr -> wir nutzen jetzt ein image

        c.drawImage(this.image, this.position.x, this.position.y)
    }
}

class Player {
    constructor({ position, velocity }) {
        this.position = position                        //Stop position
        this.velocity = velocity                        //Pac-Mans Geschwindigkeit
        this.radius = 15                                //Wie es aussieht (Größe)
        this.radians = 0.75                             //Bogenmaß
        this.openRate = 0.12                            //Die Geschwindigkeit zwischen die Wechselung von 0 und 0.75
        this.rotation = 0                               //Damit es immer auf der rechte Seite anguckt
    }
    draw() {
        c.save()                    //Speichert den aktuellen Zustand des Canvas, einschließlich aller Transformationen und Stilattribute.
        c.translate(this.position.x, this.position.y)   //Übersetzt den Ursprung des Canvas-Koordinatensystems zur aktuellen Position des Spielers.
        c.rotate(this.rotation)                         //Dreht den Canvas-Kontext um den Winkel this.rotation
        c.translate(-this.position.x, -this.position.y)
        c.beginPath()                                   //Beginnt einen neuen Pfad für das Zeichnen.
        c.arc(this.position.x, this.position.y, this.radius, this.radians, Math.PI * 2 - this.radians)       // Zeichne einen Kreis für den Player auf dem Canvas
        c.lineTo(this.position.x, this.position.y)
        c.fillStyle = 'yellow'                          // Legt die Füllfarbe des Kreises auf Gelb fest.
        c.fill()                                        // Füllt den Kreis mit der aktuellen Füllfarbe.
        c.closePath()                                   // Schließt den Pfad.
        c.restore()                                     // Stellt den Canvas-Kontext auf den zuletzt gespeicherten Zustand zurück.
    }
    update() {                                          //Eine Methode, um den Spieler zu aktualisieren.
        this.draw()                                     //Ruft die draw-Methode auf, um den Spieler auf dem Canvas zu zeichnen.
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        //Animation für die Kauen
        if (this.radians < 0 || this.radians > 0.75)    //Wen der Wert des radians außerhalb des gültigen Bereichs lieg, 
            this.openRate = - this.openRate             //dann ändert das Vorzeichen der openRate
        this.radians += this.openRate                   //und aktualisiert den Wert von radians basierend auf der openRate
    }
}

class Ghost {
    static speed = 2
    constructor({ position, velocity, ghostImages, ghostScaredImages }) {
        this.position = position
        this.velocity = velocity
        this.radius = 15                                //Wie es aussieht
        this.prevCollisions = []                        //um den alten Kollision mit den neuen vergleichen zu können
        this.speed = 2                                  //Standard Geschwindigkeit gesetzt
        this.scared = false
        this.ghostImages = ghostImages
        this.ghostScaredImages = ghostScaredImages
    }
    draw() {
        c.beginPath()
        /*c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)   // Zeichne einen Kreis für den Player auf dem Canvas + Die Startung wird 0 sein
        c.fillStyle = this.scared ? 'blue' : this.color                          // Wenn die Geiste Angst haben, dann blau färben, wenn nicht, dann this.color
        c.fill()*/                                                               //Der Fill ausrufen, den wir erstellt haben
        //brauche nicht mehr weil ich bilder jetzt nutze

        const image = this.scared ? this.ghostScaredImages : this.ghostImages
        
        c.drawImage(image, this.position.x - this.radius, this.position.y - this.radius, this.radius * 2, this.radius * 2);
        c.closePath()
    }
    update() {
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
    }
}
//Bilder für die Geiste festgelegt
const ghostImages = {
    red: createImage('./img/Blinky.png'),
    pink: createImage('./img/Pinky.png'),
    green: createImage('./img/greeny.png'),
    orange: createImage('./img/Clyde.png')
}
const ghostScaredImages = {
    blue: createImage('./img/Inky.png')
}

class Crystal {
    constructor({ position }) {
        this.position = position       
        this.radius = 3                                 //Wie groß (soll kleiener als Pac-Man sein)
    }
    draw() {
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)       //Einen Kreis auf dem Canvas zeichnen
        c.fillStyle = 'white'                                                      
        c.fill()
        c.closePath()
    }
}

class PowerUp {
    constructor({ position }) {
        this.position = position                       
        this.radius = 8                                 //Wie groß (soll kleiener als Pac-Man sein & größer als normale crystals)
    }
    draw() {
        c.beginPath()                                   
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2)
        c.fillStyle = 'white'                          
        c.fill()                                        
        c.closePath()                                   
    }
}

//arrays
const Crystals = []
const boundaries = []
const powerUps = []
const ghosts = [             
    new Ghost({                                         // Neues Ghost-Objekt erstellen
        position: {                                     // Startposition gewählt
            x: Boundary.width * 8 + Boundary.width / 2,
            y: Boundary.height * 8 + Boundary.height / 2
        },
        velocity: {                                     //Geschwindigkeit von die Geiste
            x: 0,
            y: -Ghost.speed
        },
        ghostImages: ghostImages.red,
        ghostScaredImages: ghostScaredImages.blue

    }),
    new Ghost({
        position: {         
            x: Boundary.width * 8 + Boundary.width / 2,
            y: Boundary.height * 8 + Boundary.height / 2
        },
        velocity: {      
            x: 0,
            y: -Ghost.speed
        },
        ghostImages: ghostImages.pink,
        ghostScaredImages: ghostScaredImages.blue
    }),
    new Ghost({
        position: {        
            x: Boundary.width * 8 + Boundary.width / 2,
            y: Boundary.height * 8 + Boundary.height / 2
        },
        velocity: {    
            x: 0,
            y: Ghost.speed
        },
        ghostImages: ghostImages.green,
        ghostScaredImages: ghostScaredImages.blue

    }),
    new Ghost({
        position: {         
            x: Boundary.width * 8 + Boundary.width / 2,
            y: Boundary.height * 8 + Boundary.height / 2
        },
        velocity: {            
            x: 0,
            y: Ghost.speed
        },
        ghostImages: ghostImages.orange,
        ghostScaredImages: ghostScaredImages.blue

    })
]
const player = new Player({                           // Neues Player-Objekt erstellen
    position: {                                       // Startposition des Players
        x: Boundary.width + Boundary.width / 2,
        y: Boundary.height + Boundary.height / 2
    },
    velocity: {                                      // Anfangsgeschwindigkeit des Players
        x: 0,
        y: 0
    }
})
//Tastatursteuerung
const keys = {                                      //Ein Objekt erstellen, das den Zustand der Tasten W, A, S und D speichert.
    w: {
        pressed: false
    },
    a: {
        pressed: false
    },
    s: {
        pressed: false
    },
    d: {
        pressed: false
    }
}
let lastKey = ' '                               //Zuletzt gedrückte Taste (initialisiert als Leerzeichen)
let score = 0                                   //Initialisiert den Punktestand auf 0.

const map = [                                  //Ein Array, das die Struktur des Spielfelds repräsentiert. 
    ['1', '-', '-', '-', '-', '-', '-', '-', '7', '-', '-', '-', '-', '-', '-', '-', '2'],      
    ['|', ' ', '.', '.', '.', '.', '.', 'p', '|', 'p', '.', '.', '.', '.', '.', '.', '|'],
    ['|', '.', '[', ']', '.', '[', ']', '.', '_', '.', '[', ']', '.', '[', ']', '.', '|'],
    ['|', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '|'],
    ['|', '.', '[', ']', '.', '^', '.', '[', '7', ']', '.', '^', '.', '[', ']', '.', '|'],
    ['|', '.', '.', '.', '.', '|', 'p', '.', '|', '.', 'p', '|', '.', '.', '.', '.', '|'],
    ['|', '-', '-', '2', '.', '4', ']', '.', '_', '.', '[', '3', '.', '1', '-', '-', '|'],
    ['|', '-', '-', '3', '.', '.', '.', '.', '.', '.', '.', '.', '.', '4', '-', '-', '|'],
    ['|', '.', '.', '.', '.', '^', '.', '^', '.', '^', '.', '^', '.', '.', '.', '.', '|'],
    ['|', '.', '[', ']', '.', '_', '.', '_', '.', '_', '.', '_', '.', '[', ']', '.', '|'],
    ['|', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '|'],
    ['|', '.', '[', ']', '.', '[', ']', '.', '^', '.', '[', ']', '.', '[', ']', '.', '|'],
    ['|', 'p', '.', '.', '.', '.', '.', '.', '|', '.', '.', '.', '.', '.', '.', 'p', '|'],
    ['4', '-', '-', '-', '-', '-', '-', '-', '5', '-', '-', '-', '-', '-', '-', '-', '3'],
]

function createImage(src) {                     //Eine Funktion, die ein neues Bildobjekt erstellt und dessen Quelle (src) festlegt.
    const image = new Image()                   //Diese Funktion macht es einfacher, Bilder im Spiel zu verwenden
    image.src = src
    return image
}

// Schleife zum Erstellen von Barrieren basierend auf der Karte
map.forEach((row, i) => {                      //den map auswählen um den loop auszuführen //row, i: durchläuft jede Zeile der Karte.
    row.forEach((Symbol, j) => {               //Symbol, j: durchläuft jedes Symbol in einer Zeile der Karte.
        switch (Symbol) {                      //Überprüfe das aktuelle Symbol
            case '-':                          // Wenn das Symbol ein Bindestrich ist
                boundaries.push(               // Füge ein neues Boundary-Objekt zum Array hinzu
                    new Boundary({
                        position: {                                         // Die Eigenschaften hinfügen
                            x: Boundary.width * j,                          //Die Position feststellen
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeHorizontal.png')     //mit einem Foto verbinden
                    })
                )
                break
            case '|':                   
                boundaries.push(               
                    new Boundary({
                        position: {                                        
                            x: Boundary.width * j,                        
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeVertical.png')
                    })
                )
                break
            case '1':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeCorner1.png')
                    })
                )
                break
            case '2':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeCorner2.png')
                    })
                )
                break
            case '3':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeCorner3.png')
                    })
                )
                break
            case '4':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeCorner4.png')
                    })
                )
                break
            case 'b':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/block.png')
                    })
                )
                break
            case '[':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/capLeft.png')
                    })
                )
                break
            case ']':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/capRight.png')
                    })
                )
                break
            case '_':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/capBottom.png')
                    })
                )
                break
            case '^':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/capTop.png')
                    })
                )
                break
            case '+':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeCross.png')
                    })
                )
                break
            case '5':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeConnectorTop.png')
                    })
                )
                break
            case '6':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeConnectorRight.png')
                    })
                )
                break
            case '7':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeConnectorBottom.png')
                    })
                )
                break
            case '8':
                boundaries.push(
                    new Boundary({
                        position: {
                            x: Boundary.width * j,
                            y: Boundary.height * i
                        },
                        image: createImage('./img/pipeConnectorLeft.png')
                    })
                )
                break
            case '.':
                Crystals.push(
                    new Crystal({
                        position: {
                            x: Boundary.width * j + Boundary.width / 2,         //damit die in der mitte stehen
                            y: Boundary.height * i + Boundary.height / 2        //hier auch
                        },
                    })
                )
                break
            case 'p':
                powerUps.push(
                    new PowerUp({
                        position: {
                            x: Boundary.width * j + Boundary.width / 2,        
                            y: Boundary.height * i + Boundary.height / 2     
                        },
                    })
                )
                break

        }
    })
})
// Funktion zur Erkennung von Kollisionen zwischen Kreis (Spieler) und Rechteck (Barriere)
function circleCollidesWithRectangle({ circle, rectangle
}) {
    const padding = Boundary.width / 2 - circle.radius - 1
    return (circle.position.y - circle.radius + circle.velocity.y <= rectangle.position.y + rectangle.height + padding
        && circle.position.x + circle.radius + circle.velocity.x >= rectangle.position.x - padding
        && circle.position.y + circle.radius + circle.velocity.y >= rectangle.position.y - padding
        && circle.position.x - circle.radius + circle.velocity.x <= rectangle.position.x + rectangle.width + padding)
}

let animationId

// Funktion zur Aktualisierung und Animation des Spiels
function animate() {                                            //Erestellt eine Animation auf dem Canvas
    animationId = requestAnimationFrame(animate)                // Fordert die Aktualisierung der Animation für die nächste Frame an. 
    c.clearRect(0, 0, canvas.width, canvas.height)              // Löscht den gesamten Inhalt des Canvas

    // Bewegung des Spielers basierend auf Tasteneingaben
    if (keys.w.pressed && lastKey === 'w') {                    // Wenn die W-Taste gedrückt ist
        // Schleife zur Überprüfung von Kollisionen des Spielers mit den Barrieren
        for (let i = 0; i < boundaries.length; i++) {
            // Hole jedes Boundary-Objekt aus dem Array boundaries
            const boundary = boundaries[i]
            // Überprüfe, ob der Spieler mit der aktuellen Barriere kollidiert
            if (circleCollidesWithRectangle({
                // Übergebe ein temporäres Kreisobjekt mit aktualisierter x-Geschwindigkeit (4) des Spielers
                circle: {
                    ...player, velocity: {
                        x: 0,
                        y: -4
                    }
                },
                rectangle: boundary
            })) {
                // Wenn eine Kollision festgestellt wurde, stoppe die horizontale Bewegung des Spielers
                player.velocity.y = 0
                break
            } else {
                // Falls keine Kollision festgestellt wurde, setze die horizontale Bewegung des Spielers auf (4)
                player.velocity.y = -4
            }
        }
    } else if (keys.a.pressed && lastKey === 'a') {             // Wenn die A-Taste gedrückt ist
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (circleCollidesWithRectangle({
                circle: {
                    ...player, velocity: {
                        x: -4,
                        y: 0
                    }
                },
                rectangle: boundary
            })) {
                player.velocity.x = 0
                break
            } else {
                player.velocity.x = -4
            }
        }
    } else if (keys.s.pressed && lastKey === 's') {            // Wenn die S-Taste gedrückt ist
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (circleCollidesWithRectangle({
                circle: {
                    ...player, velocity: {
                        x: 0,
                        y: 4
                    }
                },
                rectangle: boundary
            })) {
                player.velocity.y = 0
                break
            } else {
                player.velocity.y = 4
            }
        }
    } else if (keys.d.pressed && lastKey === 'd') {          // Wenn die D-Taste gedrückt ist
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (circleCollidesWithRectangle({
                circle: {
                    ...player, velocity: {
                        x: 4,
                        y: 0
                    }
                },
                rectangle: boundary
            })) {
                player.velocity.x = 0
                break
            } else {
                player.velocity.x = 4
            }
        }
    }
    //Eine Kollision zwischen Geiste und Player erkennen
    for (let i = ghosts.length - 1; 0 <= i; i--) {            //rückwärts gerichtete Schleife
        const ghost = ghosts[i]

        //Geiste berühren Player
        if (
            Math.hypot(                                     //Rechnet die Quadratwurzel der Summe der Quadrate dieser Argumente
                ghost.position.x - player.position.x,       //gibt uns die mitte vor die Geiste und player
                ghost.position.y - player.position.y
            ) <
            ghost.radius + player.radius                    //Mit den radius können wir besser bestimmt, wenn sie sich berühren
        ) {
            if (ghost.scared) {
                ghosts.splice(i, 1)                         //Wenn wir einen verängstigten Geist berühren, entfernen wir ihn aus dem Spiel 
                eatingSound.play()
                score += 100                                //100 punte hinfügen
                scoreEl.innerHTML = score                   //um diese Änderung in HTML zu sehen
            } else {
                cancelAnimationFrame(animationId)           //sonst stoppt das ganze Spiel
                console.log('you lost')
                backgroundMusic.pause();                    //Hintergrundmusik stoppt auch
                loseMusic.play();
            }
        }
    }

    //Gewinnbedingung hier
    if (Crystals.length === 0) {                            //Wenn keine Crystals mehr gibt                
        cancelAnimationFrame(animationId)                   //dann stoppt das ganze Spiel
        console.log('you won')
        backgroundMusic.pause();                            //Hintergrundmusik stoppt
        winMusic.play();                                    //Gewinnmusik spielt
    }

    //PowerUps hier
    for (let i = powerUps.length - 1; 0 <= i; i--) {        //rückwärts gerichtete Schleife
        const PowerUp = powerUps[i]
        PowerUp.draw()

        //Player berührt die PowerUps
        if (
            Math.hypot(                                     //Rechnet die Quadratwurzel der Summe der Quadrate dieser Argumente
                PowerUp.position.x - player.position.x,     //gibt uns die mitte vor die crystals und player
                PowerUp.position.y - player.position.y
            ) <
            PowerUp.radius + player.radius                  
        ) {
            powerUps.splice(i, 1)                           
            score += 50                                     //50 punte hinfügen
            scoreEl.innerHTML = score                       

            ghosts.forEach(ghost => {
                ghost.scared = true                         //wenn Kollision entsteht, dann die Geiste müssen Angst haben

                setTimeout(() => {                          //Timer für Geiste-Angst
                    ghost.scared = false                    //Wenn die 5 Sekunden durch sind, dann werden die Geiste wieder normal sein
                }, 5000,)                                   //5000 bedeutet 5 sekunden 

                //flashImage(ghostScaredImages, 5000);
            })
        }
    }

    //Crystals berühren hier:
    for (let i = Crystals.length - 1; 0 <= i; i--) {
        const Crystal = Crystals[i]
        Crystal.draw()
        if (
            Math.hypot(                                     //Rechnet die Quadratwurzel der Summe der Quadrate dieser Argumente
                Crystal.position.x - player.position.x,     
                Crystal.position.y - player.position.y
            ) <
            Crystal.radius + player.radius                  
        ) {
            Crystals.splice(i, 1)                           
            score += 10                                     //10 punte hinfügen
            scoreEl.innerHTML = score                      
        }
    }

    // Zeichnen und Aktualisieren von Barrieren und Spieler
    boundaries.forEach((Boundary) => {
        Boundary.draw()                                    // Zeichne jedes Boundary-Objekt auf dem Canvas
        if (circleCollidesWithRectangle({
            circle: player,
            rectangle: Boundary
        })
        ) {
            player.velocity.x = 0                         //Es sagt, dass wenn der Player ein boundary berührt, dann stoppt es
            player.velocity.y = 0
        }
    })
    player.update()                                      //Aktualisiert den Zustand des Spielers für die nächste Frame.

    ghosts.forEach((ghost) => {                         //den funktion ausrufen
        ghost.update()

        //Kollisionserkennunspart von Geiste
        const collisions = []
        boundaries.forEach(boundary => {                //um zu prüfen, wann ein Kollision entsteht
            if (
                !collisions.includes('right') &&        //wenn Kollisionserkennun kein 'right' hat, dann-
                circleCollidesWithRectangle({
                    circle: {
                        ...ghost,
                        velocity: {
                            x: ghost.speed,
                            y: 0
                        }
                    },
                    rectangle: boundary
                })
            ) {
                collisions.push('right')
            }
            if (
                !collisions.includes('left') &&
                circleCollidesWithRectangle({
                    circle: {
                        ...ghost,
                        velocity: {
                            x: -ghost.speed,
                            y: 0
                        }
                    },
                    rectangle: boundary
                })
            ) {
                collisions.push('left')
            }
            if (
                !collisions.includes('up') &&
                circleCollidesWithRectangle({
                    circle: {
                        ...ghost,
                        velocity: {
                            x: 0,
                            y: -ghost.speed
                        }
                    },
                    rectangle: boundary
                })
            ) {
                collisions.push('up')
            }
            if (
                !collisions.includes('down') &&
                circleCollidesWithRectangle({
                    circle: {
                        ...ghost,
                        velocity: {
                            x: 0,
                            y: ghost.speed
                        }
                    },
                    rectangle: boundary
                })
            ) {
                collisions.push('down')
            }
        })
        if (collisions.length > ghost.prevCollisions.length)
            ghost.prevCollisions = collisions
        if (JSON.stringify(collisions) !== JSON.stringify(ghost.prevCollisions))    //JSON steht für JavaScript Object Notation. `JSON.stringify()` wandelt JS-Objekte oder Arrays in einen JSON-String um.
        {
            if (ghost.velocity.x > 0) ghost.prevCollisions.push('right')            //Wenn die geiste nach rechts gehen, dann-
            else if (ghost.velocity.x < 0) ghost.prevCollisions.push('left')
            else if (ghost.velocity.y < 0) ghost.prevCollisions.push('up')
            else if (ghost.velocity.y > 0) ghost.prevCollisions.push('down')

            console.log(collisions)
            console.log(ghost.prevCollisions)

            const pathways = ghost.prevCollisions.filter((                          //loop durch jede Kollision
                collision) => {
                return !collisions.includes(collision)
            })
            console.log({ pathways })

            const direction = pathways[Math.floor(Math.random() * pathways.length)]  //math.random gibt uns random zahl von 0 bis 3, weil pathways nur 3 arrays hat
            console.log({ direction })

            switch (direction) {                      //die Richtung ändern
                case 'right':
                    ghost.velocity.x = ghost.speed
                    ghost.velocity.y = 0
                    break
                case 'left':
                    ghost.velocity.x = -ghost.speed
                    ghost.velocity.y = 0
                    break
                case 'up':
                    ghost.velocity.x = 0
                    ghost.velocity.y = -ghost.speed
                    break
                case 'down':
                    ghost.velocity.x = 0
                    ghost.velocity.y = ghost.speed
                    break
            }
            ghost.prevCollisions = []
        }     
    })

    if (player.velocity.x > 0) player.rotation = 0
    else if (player.velocity.x < 0) player.rotation = Math.PI
    else if (player.velocity.y < 0) player.rotation = Math.PI * 1.5
    else if (player.velocity.y > 0) player.rotation = Math.PI / 2

    /*LOGIK: Die Geister ändern ihre Richtung basierend 
    auf Kollisionen mit Barrieren und ihren vorherigen 
    Bewegungen, um ein realistisches Bewegungsmuster zu erzeugen.*/
}

animate()                                                //Startet die Animation.

addEventListener('keydown', ({ key }) => {              //überwachen die Tasteneingaben des Benutzers
    console.log(key)
    switch (key) {                                       // Behandlung des gedrückten Schlüssels
        case 'w':
            keys.w.pressed = true                        // W-Taste ist gedrückt
            lastKey = 'w'                                // Letzter gedrückter Schlüssel ist W
            break
        case 'a':
            keys.a.pressed = true                        // A-Taste ist gedrückt
            lastKey = 'a'                                // Letzter gedrückter Schlüssel ist A
            break
        case 's':
            keys.s.pressed = true                        // S-Taste ist gedrückt
            lastKey = 's'                                // Letzter gedrückter Schlüssel ist S
            break
        case 'd':
            keys.d.pressed = true                        // D-Taste ist gedrückt
            lastKey = 'd'                                // Letzter gedrückter Schlüssel ist D
            break
    }
    console.log(keys.d.pressed)
    console.log(keys.s.pressed)
    console.log(keys.a.pressed)
    console.log(keys.w.pressed)
    //Wenn eine Taste gedrückt wird, wird das entsprechende Flag im keys-Objekt auf true gesetzt
})

addEventListener('keyup', ({ key }) => {                 
    console.log(key)
    switch (key) {                                       
        case 'w':
            keys.w.pressed = false                       // W-Taste ist nicht mehr gedrückt
            break
        case 'a':
            keys.a.pressed = false                       // A-Taste ist nicht mehr gedrückt
            break
        case 's':
            keys.s.pressed = false                       // S-Taste ist nicht mehr gedrückt
            break
        case 'd':
            keys.d.pressed = false                       // D-Taste ist nicht mehr gedrückt
            break
    }
    console.log(keys.d.pressed)
    console.log(keys.s.pressed)
    console.log(keys.a.pressed)
    console.log(keys.w.pressed)
    //Wenn die Taste losgelassen wird, wird es auf false gesetzt.
})