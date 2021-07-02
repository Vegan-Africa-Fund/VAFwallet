import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import VuexPersist from 'vuex-persist';
import appConfig from '../../app.config.js';

import {
    APPEND_ACCOUNT,
    DEACTIVATE_ACTIVE_ACCOUNT,
    REMOVE_ACTIVE_ACCOUNT,
    SET_ACTIVE_ACCOUNT_ADDRESS,
    SET_ACTIVE_ACCOUNT_BY_ADDRESS,
    SET_BREAKPOINT,
    SET_TOKEN_PRICE,
    SET_ACCOUNT,
    MOVE_ACCOUNT,
    SET_CURRENCY,
    SET_FRACTION_DIGITS,
    SET_SEND_DIRECTION,
    PUSH_BNBRIDGE_PENDING_REQUEST,
    SHIFT_BNBRIDGE_PENDING_REQUEST,
    REMOVE_BNBRIDGE_PENDING_REQUEST,
    APPEND_CONTACT,
    MOVE_CONTACT,
    REMOVE_CONTACT,
    SET_CONTACT,
    SET_DEFI_SLIPPAGE_RESERVE,
    SET_DARK_MODE,
    SET_FUNISWAP_SLIPPAGE_TOLERANCE,
} from './mutations.type.js';
import {
    ADD_ACCOUNT,
    ADD_LEDGER_ACCOUNT,
    UPDATE_ACCOUNT,
    UPDATE_ACCOUNT_BALANCE,
    UPDATE_ACCOUNTS_BALANCES,
    REMOVE_ACCOUNT_BY_ADDRESS,
    UPDATE_CONTACT,
    ADD_CONTACT,
    ADD_METAMASK_ACCOUNT,
} from './actions.type.js';
import { fWallet } from '../plugins/fantom-web3-wallet.js';
import { arrayEquals } from '@/utils/array.js';
import backingStorage from './storage';

Vue.use(Vuex);

const vuexPlugins = [];

const vuexLocalStorage = new VuexPersist({
    // The key to store the state on in the storage provider.
    key: 'vuex',
    storage: backingStorage.storage,
    asyncStorage: backingStorage.asyncStorage,
    // Function that passes the state and returns the state with only the Objects you want to store.
    reducer: (_state) => ({
        tokenPrice: _state.tokenPrice,
        currency: _state.currency,
        fractionDigits: _state.fractionDigits,
        defiSlippageReserve: _state.defiSlippageReserve,
        fUniswapSlippageTolerance: _state.fUniswapSlippageTolerance,
        darkMode: _state.darkMode,
        accounts: _state.accounts,
        contacts: _state.contacts,
        bnbridgePendingRequests: _state.bnbridgePendingRequests,
        activeAccountIndex: _state.activeAccountIndex,
    }),
});

vuexPlugins.push(vuexLocalStorage.plugin);

/**
 * Get pending rewards amount from account structure.
 * Pending rewards are stored because of not to query totalBalance too often.
 *
 * @param {object} _account
 * @return {string}
 */
function getPendingRewards(_account) {
    let pendingRewards = [];

    if (_account && _account.delegations && _account.delegations.edges) {
        pendingRewards = _account.delegations.edges.map((_item) =>
            _item.delegation && _item.delegation.pendingRewards ? _item.delegation.pendingRewards.amount : ''
        );
    }

    return pendingRewards;
}

export const store = new Vuex.Store({
    plugins: vuexPlugins,

    state: {
        breakpoints: {},
        tokenPrice: 0,
        currency: 'USD',
        fractionDigits: 2,
        defiSlippageReserve: appConfig.settings.defaultDefiSlippageReserve,
        fUniswapSlippageTolerance: appConfig.settings.defaultFUniswapSlippageTolerance,
        darkMode: true,
        /** @type {[WalletAccount]} */
        accounts: [],
        /** @type {[WalletContact]} */
        contacts: [],
        bnbridgePendingRequests: [],
        // index of active stored account
        activeAccountIndex: -1,
        activeAccountAddress: '',
        /**
         * Which blockchain FTM will be sent to
         *
         * @type {BNBridgeDirection}
         */
        sendDirection: 'OperaToOpera',
    },

    getters: {
        /**
         * @param {Object} _state
         * @return {[WalletAccount]}
         */
        accounts(_state) {
            console.log('account getter');
            console.log(_state.accounts);
            console.log('account getter above');
            for (let i = 0, len1 = _state.accounts.length; i < len1; i++) {
                let contract = '0x65cb07d631b652090d2a047f203207851b777956';
                let api = `https://api.ftmscan.com/api?module=account&action=tokenbalance&contractaddress=${contract}&address=${_state.accounts[i].address}&tag=latest&apikey=CEJ99DVV8D6IGK2XCEC83TTW6S6HEM745Z`;
                axios.get(api).then((response) => {
                    console.log(response.data);
                    _state.accounts[i].vafbalance = response.data.result / 1000000000000000000;
                });
            }
            return _state.accounts;
        },
        /**
         * @param {Object} _state
         * @return {?WalletAccount}
         */
        currentAccount(_state) {
            return _state.activeAccountIndex > -1 ? _state.accounts[_state.activeAccountIndex] : null;
        },
        /**
         * @param {Object} _state
         * @return {number}
         */
        currentAccountAddress(_state) {
            console.log('currentAccountAddress');
            return _state.activeAccountAddress;
        },
        /**
         * Which blockchain FTM will be sent to
         *
         * @param {Object} _state
         * @return {BNBridgeDirection}
         */
        sendDirection(_state) {
            return _state.sendDirection;
        },
        /**
         * @return {number}
         */
        defiSlippageReserve() {
            return 0;
        },
        /**
         * @param {Object} _state
         * @return {number}
         */
        /*
        defiSlippageReserve(_state) {
            return _state.defiSlippageReserve / 100;
        },
        */
        /**
         * @param {Object} _state
         * @return {number}
         */
        fUniswapSlippageTolerance(_state) {
            return _state.fUniswapSlippageTolerance / 100;
        },
        /**
         * @param {Object} _state
         * @return {function(*=): ?WalletAccount}
         */
        getAccountByAddress(_state) {
            console.log('getAccountByAddress');
            return (_address) => {
                const address = fWallet.toChecksumAddress(_address);
                return _state.accounts.find((_item) => _item.address === address);
            };
        },
        /**
         * Get account and index into `state.accounts` array by account address.
         *
         * @param _state
         * @return {function(string): {index: number, account: WalletAccount}}
         */
        getAccountAndIndexByAddress(_state) {
            return (_address) => {
                const { accounts } = _state;
                console.log('getAccountAndIndexByAddress');
                const address = fWallet.toChecksumAddress(_address);
                const ret = {
                    account: null,
                    index: -1,
                };

                for (let i = 0, len1 = accounts.length; i < len1; i++) {
                    if (accounts[i].address === address) {
                        ret.account = { ...accounts[i] };
                        ret.index = i;
                        break;
                    }
                }

                return ret;
            };
        },
        /**
         * @param {Object} _state
         * @return {[WalletContact]}
         */
        contacts(_state) {
            return _state.contacts;
        },
        /**
         * Get contact and index into `state.contacts` array by contact address.
         *
         * @param _state
         * @return {function(*=): {index: number, contact: WalletContact}}
         */
        getContactAndIndexByAddress(_state) {
            return (_address) => {
                const { contacts } = _state;
                const address = _address.toLowerCase();
                const ret = {
                    contact: null,
                    index: -1,
                };

                for (let i = 0, len1 = contacts.length; i < len1; i++) {
                    if (contacts[i].address.toLowerCase() === address) {
                        ret.contact = { ...contacts[i] };
                        ret.index = i;
                        break;
                    }
                }

                return ret;
            };
        },
        /**
         * Get contact and index into `state.contacts` array by contact address.
         *
         * @param _state
         * @return {function(*=): {WalletContact}
         */
        getContactsByBlockchain(_state) {
            return (_blockchain) => {
                const { contacts } = _state;
                const rContacts = [];

                for (let i = 0, len1 = contacts.length; i < len1; i++) {
                    if (contacts[i].blockchain === _blockchain) {
                        rContacts.push({ ...contacts[i] });
                    }
                }

                return rContacts;
            };
        },
    },

    mutations: {
        /**
         * @param {Object} _state
         * @param {Object} _breakpoint
         */
        [SET_BREAKPOINT](_state, _breakpoint) {
            _state.breakpoints = {
                ..._state.breakpoints,
                ...{ [_breakpoint.code]: _breakpoint },
            };
        },
        /**
         * @param {Object} _state
         * @param {number} _tokenPrice
         */
        [SET_TOKEN_PRICE](_state, _tokenPrice) {
            _state.tokenPrice = _tokenPrice;
        },
        /**
         * @param {Object} _state
         * @param {number} _currency
         */
        [SET_CURRENCY](_state, _currency) {
            _state.currency = _currency;
        },
        /**
         * @param {Object} _state
         * @param {number} _fractionDigits
         */
        [SET_FRACTION_DIGITS](_state, _fractionDigits) {
            _state.fractionDigits = _fractionDigits;
        },
        /**
         * @param {Object} _state
         * @param {number} _defiSlippageReserve
         */
        [SET_DEFI_SLIPPAGE_RESERVE](_state, _defiSlippageReserve) {
            _state.defiSlippageReserve = _defiSlippageReserve;
        },
        /**
         * @param {Object} _state
         * @param {number} _fUniswapSlippageTolerance
         */
        [SET_FUNISWAP_SLIPPAGE_TOLERANCE](_state, _fUniswapSlippageTolerance) {
            _state.fUniswapSlippageTolerance = _fUniswapSlippageTolerance;
        },
        /**
         * @param {Object} _state
         * @param {boolean} _on
         */
        [SET_DARK_MODE](_state, _on) {
            _state.darkMode = _on;
        },
        /**
         * @param {Object} _state
         * @param {BNBridgeDirection} _direction
         */
        [SET_SEND_DIRECTION](_state, _direction) {
            _state.sendDirection = _direction;
        },
        /**
         * @param {Object} _state
         * @param {string} _address
         */
        [SET_ACTIVE_ACCOUNT_BY_ADDRESS](_state, _address) {
            console.log('set active account by address');
            const { accounts } = _state;
            const address = fWallet.toChecksumAddress(_address);

            _state.activeAccountIndex = -1;

            for (let i = 0, len1 = accounts.length; i < len1; i++) {
                if (accounts[i].address === address) {
                    _state.activeAccountIndex = i;
                    let contract = '0x65cb07d631b652090d2a047f203207851b777956';
                    let api = `https://api.ftmscan.com/api?module=account&action=tokenbalance&contractaddress=${contract}&address=${address}&tag=latest&apikey=CEJ99DVV8D6IGK2XCEC83TTW6S6HEM745Z`;
                    axios.get(api).then((response) => {
                        console.log(response.data);
                        _state.accounts[i].vafbalance = response.data.result / 1000000000000000000;
                    });
                    break;
                }
            }
        },
        /**
         * @param {Object} _state
         * @param {string} _address
         */
        [SET_ACTIVE_ACCOUNT_ADDRESS](_state, _address) {
            let xx = fWallet.toChecksumAddress(_address);
            console.log(xx);
            console.log('set active account address');
            _state.activeAccountAddress = xx;
        },
        /**
         * @param {Object} _state
         */
        [DEACTIVATE_ACTIVE_ACCOUNT](_state) {
            _state.activeAccountIndex = -1;
            _state.activeAccountAddress = '';
        },
        /**
         * @param {Object} _state
         * @param {WalletAccount} _account
         */
        [APPEND_ACCOUNT](_state, _account) {
            // if account is not created already
            if (!_state.accounts.find((_item) => _item.address === _account.address)) {
                _state.accounts.push(_account);
            }
        },
        /**
         * @param {Object} _state
         */
        [REMOVE_ACTIVE_ACCOUNT](_state) {
            if (_state.activeAccountIndex > -1) {
                _state.accounts.splice(_state.activeAccountIndex, 1);
                _state.activeAccountIndex = -1;
            }
        },
        /**
         * Update account by `_accountData` object. `_accountData` must contain `index` property.
         *
         * @param {Object} _state
         * @param {{index: number, ...}} _accountData
         */
        [SET_ACCOUNT](_state, _accountData) {
            console.log('set account');
            const { index } = _accountData;

            if (index !== undefined && index > -1) {
                delete _accountData.index;

                Vue.set(_state.accounts, index, _accountData);
            }
        },
        /**
         * Update account by `_accountData` object. `_accountData` must contain `index` property.
         *
         * @param {Object} _state
         * @param {{from: number, to: number}} _params
         */
        [MOVE_ACCOUNT](_state, _params) {
            const { from, to } = _params;
            const accountsLen = _state.accounts.length;

            if (from !== to && from >= 0 && to >= 0 && from < accountsLen && to < accountsLen) {
                _state.accounts.splice(to, 0, _state.accounts.splice(from, 1)[0]);
            }
        },
        /**
         * Push new request to `bnbridgePendingRequests` array.
         *
         * @param {Object} _state
         * @param {FSTRequest} _request
         */
        [PUSH_BNBRIDGE_PENDING_REQUEST](_state, _request) {
            _state.bnbridgePendingRequests.push(_request);
        },
        /**
         * Remove first request from `bnbridgePendingRequests` array.
         *
         * @param {Object} _state
         */
        [SHIFT_BNBRIDGE_PENDING_REQUEST](_state) {
            _state.bnbridgePendingRequests.shift();
        },
        /**
         * Remove request from `bnbridgePendingRequests` array.
         *
         * @param {Object} _state
         * @param {FSTRequest} _request
         */
        [REMOVE_BNBRIDGE_PENDING_REQUEST](_state, _request) {
            const reqIdx = _state.bnbridgePendingRequests.findIndex((_req) => _req.uuid === _request.uuid);
            if (reqIdx > -1) {
                _state.bnbridgePendingRequests.splice(reqIdx, 1);
            }
        },
        /**
         * @param {Object} _state
         * @param {WalletContact} _contact
         */
        [APPEND_CONTACT](_state, _contact) {
            // if account is not created already
            if (!_state.contacts.find((_item) => _item.address.toLowerCase() === _contact.address.toLowerCase())) {
                _state.contacts.push(_contact);
            }
        },
        /**
         * Move contact from one index to another.
         *
         * @param {Object} _state
         * @param {{from: number, to: number}} _params
         */
        [MOVE_CONTACT](_state, _params) {
            const { from, to } = _params;
            const contactsLen = _state.contacts.length;

            if (from !== to && from >= 0 && to >= 0 && from < contactsLen && to < contactsLen) {
                _state.contacts.splice(to, 0, _state.contacts.splice(from, 1)[0]);
            }
        },
        /**
         * Remove contact by index.
         *
         * @param {Object} _state
         * @param {number} _index
         */
        [REMOVE_CONTACT](_state, _index) {
            if (_index > -1 && _index < _state.contacts.length) {
                _state.contacts.splice(_index, 1);
            }
        },
        /**
         * Update contact by `_contactData` object. `_contactData` must contain `index` property.
         *
         * @param {Object} _state
         * @param {{index: number, ...}} _contactData
         */
        [SET_CONTACT](_state, _contactData) {
            const { index } = _contactData;

            if (index !== undefined && index > -1 && index < _state.contacts.length) {
                delete _contactData.index;

                Vue.set(_state.contacts, index, _contactData);
            }
        },
    },

    actions: {
        /**
         * @param {Object} _context
         * @param {Object} _keystore
         */
        async [ADD_ACCOUNT](_context, _keystore) {
            console.log('add account');
            const address = fWallet.toChecksumAddress(_keystore.address);
            const balance = await fWallet.getBalance(address);
            const account = {
                address,
                balance: balance.balance,
                totalBalance: balance.totalValue,
                pendingRewards: getPendingRewards(balance),
                keystore: _keystore,
                name: `Wallet ${_context.state.accounts.length + 1}`,
            };

            _context.commit(APPEND_ACCOUNT, account);
        },
        /**
         * @param {Object} _context
         * @param {WalletAccount} _account
         */
        async [ADD_LEDGER_ACCOUNT](_context, _account) {
            const address = fWallet.toChecksumAddress(_account.address);

            if (!_context.getters.getAccountByAddress(address)) {
                const balance = await fWallet.getBalance(address);
                const account = {
                    ..._account,
                    address,
                    balance: balance.balance,
                    totalBalance: balance.totalValue,
                    pendingRewards: getPendingRewards(balance),
                    isLedgerAccount: true,
                    name: `Wallet ${_context.state.accounts.length + 1}`,
                };

                _context.commit(APPEND_ACCOUNT, account);
            }
        },
        /**
         * @param {Object} _context
         * @param {string} _address
         */
        async [ADD_METAMASK_ACCOUNT](_context, _address) {
            const address = fWallet.toChecksumAddress(_address);

            if (!_context.getters.getAccountByAddress(address)) {
                const balance = await fWallet.getBalance(address);
                const account = {
                    address,
                    balance: balance.balance,
                    totalBalance: balance.totalValue,
                    pendingRewards: getPendingRewards(balance),
                    isMetamaskAccount: true,
                    name: `Wallet ${_context.state.accounts.length + 1}`,
                };

                _context.commit(APPEND_ACCOUNT, account);
            }
        },
        /**
         * @param {Object} _context
         */
        async [UPDATE_ACCOUNTS_BALANCES](_context) {
            // setTimeout(() => console.log('waiting?'), 0);
            const accounts = _context.getters.accounts;
            let account;
            // const balances = await Promise.all(accounts.map((_address) => fWallet.getBalance(_address.address)));

            for (let i = 0; i < accounts.length; i++) {
                account = accounts[i];
                let contract = '0x65cb07d631b652090d2a047f203207851b777956';
                let api = `https://api.ftmscan.com/api?module=account&action=tokenbalance&contractaddress=${contract}&address=${accounts[i].address}&tag=latest&apikey=CEJ99DVV8D6IGK2XCEC83TTW6S6HEM745Z`;
                if (isNaN(accounts[i].vafbalance)) {
                    axios.get(api).then((response) => {
                        console.log(response.data);
                        // setTimeout(() => console.log('waiting?'), 100000);
                        let vafs = response.data.result / 1000000000000000000;
                        if (isNaN(vafs)) {
                            console.log('bad vaf check');
                        } else {
                            accounts[i].vafbalance = vafs;
                            console.log('good vaf check waiting now');
                            setTimeout(() => console.log('waiting because good check'), 10000000);
                        }
                    });
                } else {
                    console.log(`already set VAF of ${accounts[i].vafbalance} for ${accounts[i].address}`);
                }
                if (isNaN(accounts[i].balance)) {
                    accounts[i].balance = await fWallet.getBalance(account.address, false, true);
                } else {
                    console.log(`already set FTM of ${accounts[i].balance} for ${accounts[i].address}`);
                }
            }
        },
        /**
         * @param {Object} _context
         * @param {WalletAccount} [_account]
         */
        async [UPDATE_ACCOUNT_BALANCE](_context, _account) {
            const account = _account || _context.getters.currentAccount;
            console.log('update account balance');
            await new Promise((r) => setTimeout(r, 10000));
            if (account) {
                const { index } = _context.getters.getAccountAndIndexByAddress(account.address);
                let balance = await fWallet.getBalance(account.address, false, true);
                let pendingRewards = getPendingRewards(balance);
                console.log(balance);
                if (
                    index > -1 &&
                    (account.balance !== balance.balance || !arrayEquals(account.pendingRewards, pendingRewards))
                ) {
                    balance = await fWallet.getBalance(account.address);
                    // console.log(balance);

                    _context.commit(SET_ACCOUNT, {
                        ...account,
                        balance: balance.balance,
                        totalBalance: balance.totalValue,
                        pendingRewards,
                        index,
                    });
                }
            }
        },
        /**
         * @param {Object} _context
         * @param {Object} _accountData
         */
        [UPDATE_ACCOUNT](_context, _accountData) {
            const { account, index } = _context.getters.getAccountAndIndexByAddress(_accountData.address);
            console.log('update account');
            if (account) {
                const name = _accountData.name !== account.address ? _accountData.name : '';
                const { activeAccountAddress } = _context.state; // store active account address

                _context.commit(SET_ACCOUNT, {
                    ...account,
                    name,
                    index,
                });

                if (_accountData.order - 1 !== index) {
                    _context.commit(MOVE_ACCOUNT, {
                        from: index,
                        to: _accountData.order - 1,
                    });
                }

                // order of accounts can change so set stored active account again
                _context.commit(SET_ACTIVE_ACCOUNT_BY_ADDRESS, activeAccountAddress);
            }
        },
        /**
         * @param {Object} _context
         * @param {string} _address
         * @return Promise<boolean> Current account removed?
         */
        [REMOVE_ACCOUNT_BY_ADDRESS](_context, _address) {
            const { account, index } = _context.getters.getAccountAndIndexByAddress(_address);
            const accounts = _context.getters.accounts;
            let activeAccountRemoved = false;
            console.log('remove account by address');
            if (account) {
                accounts.splice(index, 1);

                if (index === _context.state.activeAccountIndex) {
                    _context.commit(DEACTIVATE_ACTIVE_ACCOUNT);
                    activeAccountRemoved = true;
                }
            }

            return activeAccountRemoved;
        },
        /**
         * @param {Object} _context
         * @param {WalletContact} _contact
         */
        [ADD_CONTACT](_context, _contact) {
            const { order } = _contact;
            const contacts = _context.getters.contacts;
            console.log('add contact');
            delete _contact.order;

            _context.commit(APPEND_CONTACT, _contact);

            if (order !== contacts.length) {
                _context.commit(MOVE_CONTACT, {
                    from: contacts.length - 1,
                    to: order - 1,
                });
            }
        },
        /**
         * @param {Object} _context
         * @param {WalletContact} _contact
         */
        [UPDATE_CONTACT](_context, _contact) {
            const { contact, index } = _context.getters.getContactAndIndexByAddress(_contact.address);
            console.log('update contact');
            if (contact) {
                const name = _contact.name !== contact.address ? _contact.name : '';
                const { order } = _contact;

                delete _contact.order;

                _context.commit(SET_CONTACT, {
                    ...contact,
                    ..._contact,
                    name,
                    index,
                });

                if (order - 1 !== index) {
                    _context.commit(MOVE_CONTACT, {
                        from: index,
                        to: order - 1,
                    });
                }
            }
        },
    },
});
