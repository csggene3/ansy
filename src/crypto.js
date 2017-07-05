import WIF from 'wif'
import EC from 'ecurve'
import BigInteger from 'bigi'
import { SHA256, RIPEMD160, enc } from 'crypto-js'
import bs58 from 'bs58'

const ec = EC.getCurveByName('secp256r1')
const ADDR_VERS = '17'

const crypto = {
  getCurvePtFromHex: (privateKey) => {
    let privateKeyBuffer = new Buffer(privateKey, 'hex')
    let curvePt = ec.G.multiply(BigInteger.fromBuffer(privateKeyBuffer))
    return curvePt
  },
  getPubFromHex: (privateKey) => {
    let curvePt = crypto.getCurvePtFromHex(privateKey)
    return curvePt.getEncoded(true).toString('hex')
  },
  getWifFromHex: (privateHex) => {
    return WIF.encode(128, new Buffer(privateHex, 'hex'), true)
  },
  getAddrFromPri: (privateKey) => {
    // Have no idea why we extend the key but it works...
    let publicKey = '21' + crypto.getPubFromHex(privateKey) + 'ac'
    publicKey = enc.Hex.parse(publicKey)
    let ripHash = RIPEMD160(SHA256(publicKey)).toString()
    // Add ADDR_VERS in front of RIPEMD
    ripHash = ADDR_VERS + ripHash
    // SHA256 2 times
    let shaOutput = SHA256(SHA256(enc.Hex.parse(ripHash))).toString()
    // Address = RIPEMD + SHA[0:4]
    let shaChecksum = Buffer.from(shaOutput.substring(0,8), 'hex')
    // Construct RIPEMD buffer
    let ripBuffer = Buffer.from(ripHash, 'hex')
    // Construct 25 byte Address Buffer
    let addrBuffer = Buffer.concat([ripBuffer, shaChecksum])
    return bs58.encode(addrBuffer)
  }
}

export default crypto