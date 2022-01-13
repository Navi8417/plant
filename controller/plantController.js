const Plant = require('../model/plant')
const User = require('../model/user')
const multer = require('multer')
const jwt = require('jsonwebtoken')
const { exec } = require('child_process')
const { promisify } = require('util');
const execute = promisify(exec)
const axios = require('axios')
const fs = require('fs')
const { encode, decode } = require('node-base64-image')
const formData = require('form-data');
const cloudinary = require('cloudinary').v2;
var rem = 495;
//https://api.gbif.org/v1/occurrence/search?scientificName=Adenium multiflorum Klotzsch
cloudinary.config({
  cloud_name: 'dl9gsmvqc',
  api_key: '552698194125665',
  api_secret: 'LOH1HgW62BXk8xXBY27e-KSz_04'
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now()
    cb(null, file.fieldname + '-' + uniqueSuffix + "." + file.mimetype.split('/')[1])
  }
})

const uploads = multer({ storage }).array('plantImage', 3)

exports.getAllPosts = async (req, res) => {

  try {
    let data = await Plant.find().sort('-_id').populate({
      path: 'createdBy',
      select: 'name -_id'
    })

    res.status(200).json({
      status: 'success',
      data
    })

  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message
    })
  }
}

exports.createPost = async (req, res) => {
  try {

    let token = req.headers.authorization.split(' ')[1]
    let decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    let filename = `userUploadedImage-${Date.now()}-${decoded.id}`
   
    let base64String = req.body.base64

    await decode(base64String, { fname: filename, ext: 'jpeg' })

    const upload = await cloudinary.uploader.upload(`${filename}.jpeg`)

    let resp = await axios({
      method: 'GET',
      url: `https://my-api.plantnet.org/v2/identify/all?api-key=${process.env.PLANT_NET_KEYASAWA}&images=${upload.secure_url}`
    })
      
  let plant = new Plant({
      userUploadedImage:[upload.secure_url],
      posts: resp.data.results,
      createdBy: decoded.id
    })
    let data = await plant.save()


    res.status(200).json({
      status: 'success',
      data
    })

    await execute(`rm ${filename}.jpeg`).then(() => {
      console.log('files deleted successfully')
    })


  } catch (err) {
    await execute(`rm ${filename}.jpeg`).then(() => {
      console.log('files deleted successfully')
    })
    res.status(400).json({
      status: 'fail',
      message: err.message
    })
  }


}




exports.getDetails = async (req, res) => {

  if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
  }

  uploads(req, res, async (err) => {
    try {

      let form = new formData();

      // req.files.forEach(file => {
      //   form.append('images', fs.createReadStream(`./uploads/${file.filename}`))
      // })

      let base64 = req.body.base64
      await decode(base64, { fname: 'example', ext: 'jpg' })
      form.append('images', fs.createReadStream('./example.jpg'))
      console.log(form)
      if (rem === 0)
        return res.status(400).json({
          status: 'fail',
          message: 'Daily limit crossed'
        })

      let resp = await axios.post(
        `https://my-api.plantnet.org/v2/identify/all?api-key=${process.env.PLANT_NET_KEYASAWA}`,
        form, {
        headers: form.getHeaders()
      }
      )


      rem = resp.data.remainingIdentificationRequests

      res.status(200).json({
        status: 'success',
        results: resp.data.results.length,
        data: resp.data.results
      })


      await execute('rm example.jpg').then(() => {
        console.log('files deleted successfully')
      })

    } catch (err) {
      console.log(err)
      res.status(404).json({
        status: 'fail',
        message: err.message
      })

      // await execute('rm ./uploads/*').then(() => {
      //   console.log('files deleted successfully')
      // })
    }
  })//uploads


}//get details