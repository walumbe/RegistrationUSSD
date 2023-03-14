require("dotenv").config()
const express = require("express")
const app = express()
const mongoose = require("mongoose")
const UssdMenu = require("ussd-builder")
const mongoString = process.env.DATABASE_URL
const database = mongoose.connection
database.on("error", (error) => {
    console.error(error)
})
database.once("connected", ()=> {
    console.log("Database connected")
})
app.use(express.json)
app.use(express.urlencoded({extended: true}))

let menu = new UssdMenu()
menu.startState({
    run: () => {
        // Use menu.con() to send response without terminating session
        menu.con("Welcome! Ready to register for the xixi Conference:" + 
        "\n1. Get Started" +
        "\n2. Get Out")
    },
    // next object links to next state based on user input
    next:{
        "1":"register",
        "2":"quit"
    }
})

menu.state("register", {
    run:() => {
        menu.con("Before we go ahead, what is your name?")
    },
    next:{
        "*[a-zA-Z]+":"register.tickets"
    }
})
menu.state("register.tickets", {
    run: () => {
        let name = menu.val
        dataToSave.name = name
        console.log(dataToSave)
        menu.con("How many tickets would you like to reserve?")
    },
    next:{
        // using regext to match user input to next state
        "*\\d+":"end"
    }
})

menu.state("end", {
    run: async () => {
        let tickets = menu.val
        dataToSave.tickets = tickets
        console.log(dataToSave)
        // save the data
        const data = new mongoose.Model({
            name:dataToSave.name,
            tickets:dataToSave.tickets
        })
        const dataSaved = await data.save()
        menu.end("Awesome!We have your tickets reserved. Sending a confirmation text shortly.")
    }
})

menu.state("quit", {
    run:() => {
        menu.end("Goodbye :)")
    }
})
// Registering USSD handler with Express
app.post("/ussd", (req, res) => {
    menu.run(req.body, ussdResult => {
        res.send(ussdResult)
    })
})


const port = process.env.PORT || 3000
app.listen(port, ()=>{
    console.log(`App listening on port ${port}`)
})