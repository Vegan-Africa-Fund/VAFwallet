import web3utils from 'web3-utils';
import { formatNumberByLocale } from '../filters.js';

const WEI_IN_FTM = 1000000000000000000;

/**
 * @return {number}
 */
export function WEIToFTM(_value) {
    // console.log(parseFloat(web3utils.fromWei(_value, 'ether')), _value / WEI_IN_FTM);
    return _value / WEI_IN_FTM;
}
/**
 * @param {string} _address
 * @return {string}
 */
export function checkVAF(_address) {
    // let apikey = 'CEJ99DVV8D6IGK2XCEC83TTW6S6HEM745Z';
    console.log(_address);
    // let add = '0xba821dc848803900c01ba7ac1d7a034b95b1ed97';
    let contract = '0x65cb07d631b652090d2a047f203207851b777956';
    let apikey = 'Q7KEX42J31WNBAH8FNVSYS7P351WHS4YIM';
    const headers = new Headers();
    headers.append('Authorization', 'api_key');
    const request = new Request(
        `https://api.ftmscan.com/api?module=account&action=tokenbalance&contractaddress=${contract}&address=${_address}&tag=latest&apikey=${apikey}`
    );
    fetch(request).then((resx) => {
        let rr = resx.json();
        console.log(rr);
        console.log(resx);
        console.log('i am in the check vaf functino');
        return rr;
    });
}
/**
 * @return {number}
 */
export function WeiToFtm(_value) {
    return parseFloat(web3utils.fromWei(_value, 'ether'));
}

/**
 * @return {number}
 */
export function FTMToWEI(_value) {
    return _value * WEI_IN_FTM;
}

/**
 * @param {*} _value
 * @param {number} [_tokenPrice]
 * @return {number}
 */
export function FTMToUSD(_value, _tokenPrice = 0) {
    return _value * _tokenPrice;
}

/**
 * Convert value to FTM.
 *
 * @param {string|number} _value
 * @return {string}
 */
export function toFTM(_value) {
    return formatNumberByLocale(WEIToFTM(_value));
}

/**
 * Fetch number of VAFs in a wallet
 *
 * @param {string|number} _address
 * @return {string}
 */
export async function getVAFs(_address) {
    // let apikey = 'CEJ99DVV8D6IGK2XCEC83TTW6S6HEM745Z';
    console.log(_address);
    let add = '0xba821dc848803900c01ba7ac1d7a034b95b1ed97';
    let contract = '0xddcb3ffd12750b45d32e084887fdf1aabab34239';
    let apikey = 'Q7KEX42J31WNBAH8FNVSYS7P351WHS4YIM';
    const data = await fetch(`https://api.ftmscan.com/api?
    module=account&action=tokenbalance
    &contractaddress=${contract}
    &address=${add}
    &tag=latest&apikey=${apikey}`);
    console.log(data);
    console.log(data.json());
    console.log('did i get here');
    // let vafbalance = res;
    return data;
}

/**
 * Check if given string is transaction hash, address or block number.
 *
 * @return {'transaction_hash' | 'address' | 'block' | ''}
 */
export function getTypeByStr(_str) {
    let type = '';
    let num = 0;

    if (_str) {
        if (web3utils.isHexStrict(_str)) {
            if (_str.length === 66) {
                type = 'transaction_hash';
                // } else if (web3utils.toChecksumAddress(_str)) {
            } else if (web3utils.isAddress(_str)) {
                type = 'address';
            }
        } else {
            num = parseInt(_str);
            if (!isNaN(num)) {
                type = 'block';
            }
        }
    }

    return type;
}
