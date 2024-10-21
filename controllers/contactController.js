const { ObjectId } = require("mongodb")
const petsCollection = require("../db").db().collection("pets")
const contactsCollection = require("../db").db().collection("contacts")
const validator = require('validator');
const nodemailer = require("nodemailer")
const sanitizeHtml = require("sanitize-html")

const sanitizeOptions = {
    allowedTags: [],
    allowedAttributes: {}
}

exports.submitContact = async function (req, res, next) {
    // Check for spam on visitor test entry. Modified var from 'secret' to 'visitorTest'
    if (req.body.visitorTest.toUpperCase() !== "PUPPY") {
        console.log("spam detected")
        return res.json({ message: "try again" })
    }

    if (!validator.isEmail(req.body.visitorEmail)) {
        console.log("email invalid")
        return res.json({ message: "check email address" })
    }

    // Check Pet ID. ObjectId is the MongoDB primary key and data-id in our form, also petID defined in main.js.
    if (!ObjectId.isValid(req.body.petId)) {
        console.log("invalid pet id")
        return res.json({ message: "Sorry!" })
    }

    // Convert petId from string to MongoDB ObjectId data type
    req.body.petId = new ObjectId(req.body.petId)

    // Check Pet ID, if it exists in MongoDB
    const doesPetExist = await petsCollection.findOne({ _id: req.body.petId });

    if (!doesPetExist) {
        console.log("invalid pet id nonexist")
        return res.json({ message: "Sorry, not valid" })
    }

    // Check input data type - only allow strings
    if (typeof req.body.visitorName !== "string") {
        req.body.visitorName = ""
    }

    if (typeof req.body.visitorEmail !== "string") {
        req.body.visitorEmail = ""
    }

    if (typeof req.body.visitorComment !== "string") {
        req.body.visitorComment = ""
    }

    const contactObject = {
        petId: req.body.petId,
        name: sanitizeHtml(req.body.visitorName, sanitizeOptions),
        email: sanitizeHtml(req.body.visitorEmail, sanitizeOptions),
        comment: sanitizeHtml(req.body.visitorComment, sanitizeOptions),
    }


    // Send test email to Mailtrap
    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: process.env.MAILTRAPUSERNAME,
            pass: process.env.MAILTRAPPASSWORD
        }
    })

    // Brads Try - Catch method
    try {
        const mssg1 = transporter.sendMail({
            to: contactObject.email,
            from: "catadoption@localhost",
            subject: `Your message about ${doesPetExist.name}`,
            html: `<h3 style="color: purple;">Thank you for your message</h3><p>Your message: <em>${contactObject.comment}</em></p><p>We will be in touch soon!</p>`
        })

        const mssg2 = transporter.sendMail({
            to: "petadoptionmanager@localhost",
            from: "dogadoption@localhost",
            subject: `New message about ${doesPetExist.name}`,
            html: `<h3 style="color: blue;">${contactObject.name} sent a message from the website.</h3><p>Message: <em>${contactObject.comment}</em></p><p>Animal: ${doesPetExist.name}</p><p>Please get in touch at ${contactObject.email}</p>`
        })

        const dataPromise = await contactsCollection.insertOne(contactObject)

        await Promise.all([mssg1, mssg2, dataPromise])

    } catch (err) {
        next(err)
    }

    res.send("Thanks for sending data to us")

}

exports.viewPetContacts = async (req, res) => {

    if (!ObjectId.isValid(req.params.id)) {
        console.log("bad id")
        return res.redirect("/")
    }

    const pet = await petsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!pet) {
        console.log("pet does not exist")
        return res.redirect("/")
    }

    const contacts = await contactsCollection.find({ petId: new ObjectId(req.params.id) }).toArray()
    res.render("pet-contacts", { contacts, pet })
}