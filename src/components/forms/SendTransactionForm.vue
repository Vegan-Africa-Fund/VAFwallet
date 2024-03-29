<template>
    <div class="send-transaction-form">
        <f-card class="f-card-double-padding">
            <f-form ref="form" center-form @f-form-submit="onFormSubmit">
                <fieldset class="">
                    <legend v-if="token.address" class="h2">
                        Send {{ tokenSymbol }} <span class="f-steps"><b>1</b> / 2</span>
                    </legend>
                    <legend v-else class="h2">
                        <div class="cont-with-back-btn">
                            <span>
                                Send Opera FTM <span class="f-steps"><b>2</b> / 3</span>
                            </span>
                            <button type="button" class="btn light" @click="onPreviousBtnClick">Back</button>
                        </div>
                    </legend>

                    <div class="form-body">
                        <div v-if="token.address" class="available-balance">
                            <div class="row align-items-center no-collapse">
                                <div class="col ab-label">Available balance</div>
                                <div class="col ab-balance">
                                    <f-token-value :value="availableERC20TokenBalance" :token="token" />
                                </div>
                            </div>
                        </div>

                        <f-input
                            v-model="amount"
                            label="Amount"
                            field-size="large"
                            type="number"
                            autocomplete="off"
                            min="0"
                            step="any"
                            name="amount"
                            :validator="checkAmount"
                            validate-on-input
                        >
                            <template #top="sProps">
                                <div class="input-label-layout">
                                    <label :for="sProps.inputId">{{ sProps.label }}</label>
                                    <button type="button" class="btn light small" @click="onEntireBalanceClick">
                                        Entire Balance
                                    </button>
                                </div>
                            </template>
                            <template #bottom="sProps">
                                <f-message v-show="sProps.showErrorMessage" type="error" role="alert" with-icon>
                                    {{ amountErrMsg }}
                                </f-message>
                            </template>
                        </f-input>

                        <address-field
                            :blockchain="blockchain"
                            :label="sendToLabel"
                            field-size="large"
                            name="address"
                            :validator="checkAddress"
                            :validate-on-input="sendDirection === 'OperaToOpera'"
                        >
                            <template #bottom="sProps">
                                <f-message v-show="sProps.showErrorMessage" type="error" role="alert" with-icon>
                                    {{ sendToErrorMsg }}
                                </f-message>
                                <div v-if="resolvedAddress">Domain resolved to {{ resolvedAddress }}</div>
                                <div v-if="ETHOrBNBAccountBalance">
                                    {{ ETHOrBNBAccountBalance }}
                                </div>
                            </template>
                        </address-field>

                        <f-input
                            v-if="sendDirection !== 'OperaToEthereum' && !token.address"
                            label="Memo (optional)"
                            field-size="large"
                            name="memo"
                        />

                        <div class="align-center form-buttons">
                            <template v-if="sendDirection !== 'OperaToOpera'">
                                <f-message type="warning" class="align-center">
                                    All bridge transactions incur a fee of {{ minFTMToTransfer }} FTM, deducted from the
                                    transfer amount.
                                </f-message>
                                <f-message
                                    v-if="amount >= minFTMToTransfer && checkAmount(amount)"
                                    type="info"
                                    class="big"
                                >
                                    You will receive <b>{{ amount - minFTMToTransfer }} FTM</b>
                                </f-message>
                                <br />
                            </template>

                            <button type="submit" class="btn large break-word" style="max-width: 100%;">
                                Continue
                            </button>
                        </div>
                    </div>
                </fieldset>
            </f-form>
        </f-card>
    </div>
</template>

<script>
import FForm from '../core/FForm/FForm.vue';
import FMessage from '../core/FMessage/FMessage.vue';
import FInput from '../core/FInput/FInput.vue';
import FCard from '../core/FCard/FCard.vue';
import { mapGetters } from 'vuex';
import { eventBusMixin } from '../../mixins/event-bus.js';
import { BNBridgeExchangeErrorCodes } from '../../plugins/bnbridge-exchange/bnbridge-exchange.js';
import AddressField from '../AddressField/AddressField.vue';
import FTokenValue from '@/components/core/FTokenValue/FTokenValue.vue';
import appConfig from '../../../app.config.js';
import Resolution from '@unstoppabledomains/resolution';
const resolution = new Resolution();

export default {
    name: 'SendTransactionForm',

    components: {
        FTokenValue,
        AddressField,
        FCard,
        FInput,
        FMessage,
        FForm,
    },

    mixins: [eventBusMixin],

    props: {
        /** @type {DefiToken} */
        token: {
            type: Object,
            default() {
                return {};
            },
        },
    },

    data() {
        return {
            amountErrMsg: 'Invalid amount',
            gasPrice: '',
            amount: '',
            sendToErrorMsg: 'Enter a valid Opera FTM address or domain name',
            /** Balance of BNB or ETH account. */
            ETHOrBNBAccountBalance: '',
            minFTMToTransfer: appConfig.bnbridgeApi.minFTMToTransfer,
            resolvedAddress: null,
        };
    },

    computed: {
        ...mapGetters(['currentAccount', 'sendDirection']),

        /**
         * @return {number}
         */
        remainingBalance() {
            const { currentAccount } = this;
            let price = 0;

            if (this.gasPrice && currentAccount) {
                price = this.$fWallet.getRemainingBalance(currentAccount.balance, this.gasPrice);
            }

            return price;
        },

        /**
         * @return {number}
         */
        maxRemainingBalance() {
            const { currentAccount } = this;
            let price = 0;

            if (this.gasPrice && currentAccount) {
                price = this.$fWallet.getMaxRemainingBalance(currentAccount.balance, this.gasPrice);
            }

            return price;
        },

        /**
         * @return {number}
         */
        maxRemainingErc20TokenBalance() {
            const { token } = this;

            return this.$defi.fromTokenValue(token.balanceOf || token.availableBalance, token) || 0;
        },

        /**
         * @return {number}
         */
        availableERC20TokenBalance() {
            return this.maxRemainingErc20TokenBalance;
        },

        /**
         * @return {string}
         */
        tokenSymbol() {
            const { token } = this;

            return token.address ? this.$defi.getTokenSymbol(token) : 'FTM';
        },

        /**
         * @return {string}
         */
        sendToLabel() {
            let sendTo = 'Send To (address or domain)';

            switch (this.sendDirection) {
                case 'OperaToBinance':
                    sendTo = 'BNB Receive Address';
                    break;
                case 'OperaToEthereum':
                    sendTo = 'ETH Receive Address';
                    break;
            }

            return sendTo;
        },

        /**
         * @return {WalletBlockchain}
         */
        blockchain() {
            let blockchain = 'fantom';

            switch (this.sendDirection) {
                case 'OperaToBinance':
                    blockchain = 'binance';
                    break;
                case 'OperaToEthereum':
                    blockchain = 'ethereum';
                    break;
            }

            return blockchain;
        },
    },

    created() {
        this.$fWallet.getGasPrice().then((_gasPrice) => {
            this.gasPrice = _gasPrice;
        });

        this._eventBus.on('account-picked', this.onAccountPicked);
    },

    mounted() {
        /*
        const el = findFirstFocusableDescendant(this.$el);
        if (el) {
            el.focus();
        }
        */
    },

    methods: {
        /**
         * @param {string} _value
         */
        async checkAddress(_value) {
            const { sendDirection } = this;
            let validAddress = false;
            let value = _value.trim();

            this.ETHOrBNBAccountBalance = '';

            if (sendDirection === 'OperaToOpera') {
                value = (await this.resolveAddress(value, 'FTM', 'OPERA')) || value;
                validAddress = this.$fWallet.isValidAddress(value);
                this.sendToErrorMsg = 'Enter a valid Opera FTM address or domain name';
            } else if (sendDirection === 'OperaToBinance') {
                validAddress = this.$bnb.isBNBAddress(value);
                this.sendToErrorMsg = 'Enter a valid BNB address';

                if (validAddress) {
                    if (value.toLowerCase() === 'bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23') {
                        validAddress = false;
                        this.sendToErrorMsg =
                            "Deposits to Binance's central BEP2 wallet address have been disabled to ensure users don't lose funds through MEMO errors. Please choose Ethereum as the receiving blockchain and use your Binance ERC20 deposit address instead";
                    } else {
                        try {
                            const data = await this.$bnb.getBNBBalances(value);
                            this.ETHOrBNBAccountBalance = `Current Fantom Balance: ${data.balance} FTM`;
                        } catch (_error) {
                            validAddress = false;

                            if (_error.code === BNBridgeExchangeErrorCodes.BRIDGE_IS_DOWN) {
                                this.sendToErrorMsg = 'Bridge is down';
                            } else if (_error.code !== BNBridgeExchangeErrorCodes.BAD_BNB_ADDRESS) {
                                this.sendToErrorMsg = _error;
                            }
                        }
                    }
                }
            } else if (sendDirection === 'OperaToEthereum') {
                validAddress = this.$bnb.isETHAddress(value);
                this.sendToErrorMsg = 'Enter a valid ETH address';

                if (validAddress) {
                    try {
                        const balance = await this.$bnb.getETHBalance(value);
                        this.ETHOrBNBAccountBalance = `Current Fantom Balance: ${balance} FTM`;
                    } catch (_error) {
                        validAddress = false;

                        if (_error.code === BNBridgeExchangeErrorCodes.BRIDGE_IS_DOWN) {
                            this.sendToErrorMsg = 'Bridge is down';
                        } else if (_error.code !== BNBridgeExchangeErrorCodes.BAD_ETH_ADDRESS) {
                            this.sendToErrorMsg = _error;
                        }
                    }
                }
            }

            return validAddress;
        },

        async resolveAddress(value, currency, chain) {
            this.resolvedAddress = null;
            if (resolution.isSupportedDomainInNetwork(value)) {
                try {
                    if (chain) {
                        this.resolvedAddress = await resolution.multiChainAddr(value, currency, chain);
                    } else {
                        this.resolvedAddress = await resolution.addr(value, currency);
                    }
                } catch (e) {
                    console.log('Domain resolution failed', e);
                }
            }
            return this.resolvedAddress;
        },

        checkAmount(_value) {
            const remainingBalance = this.token.address
                ? parseFloat(this.maxRemainingErc20TokenBalance)
                : parseFloat(this.remainingBalance);
            const value = parseFloat(_value);
            const { minFTMToTransfer } = this;
            const operaToBridge = this.sendDirection !== 'OperaToOpera';
            const { tokenSymbol } = this;
            let ok = false;

            this.amountErrMsg = 'Invalid amount';

            if (!isNaN(value)) {
                if (value <= remainingBalance && value > 0) {
                    if (operaToBridge && value < minFTMToTransfer) {
                        this.amountErrMsg = `You must transfer at least ${minFTMToTransfer} ${tokenSymbol}`;
                    } else {
                        ok = true;
                    }
                } else if (remainingBalance < 0) {
                    this.amountErrMsg = 'You have no balance left';
                } else if (value > 0) {
                    this.amountErrMsg = `You can transfer max ${remainingBalance} ${tokenSymbol}`;
                }

                if (!ok && value === 0) {
                    ok = true;
                }
            }

            return ok;
        },

        /*
        onFormInput() {
            this.submitDisabled = !this.validate();
        },

        onFormChange() {
            this.submitDisabled = !this.validate();
        },

        */
        async onFormSubmit(_event) {
            const { data } = _event.detail;
            const { sendDirection } = this;

            if (this.currentAccount && data.amount) {
                if (sendDirection === 'OperaToOpera') {
                    data.opera_address = this.resolvedAddress || data.address;
                } else if (sendDirection === 'OperaToBinance') {
                    data.bnb_address = data.address;
                } else if (sendDirection === 'OperaToEthereum') {
                    data.eth_address = data.address;
                }

                // TMP!
                /*
                this.$emit('change-component', {
                    to: 'transaction-completing',
                    from: 'send-transaction-form',
                    data: {
                        address: 'bnb1jvlepaalght59kwhfh44k54u3elmhuurnt0lxc',
                        amount: '0.1',
                        fee: '0.000044',
                        from_opera_address: '0x76AE07E6D236c1aE3F5C3112F387ad82c69A2471',
                        memo: '',

                        bnb_address: 'bnb1jvlepaalght59kwhfh44k54u3elmhuurnt0lxc',
                        direction: 'OperaToBinance',
                        opera_address: '0xE504aF2999644A86162Df892E86E3809a365AEBa',
                        uuid: 'd727d651-c06e-d770-fb35-87fc7a4f0ade',
                        tx: '0xefb8001268d8b5441678004b9641f26ad6b1577b',
                    },
                });
*/

                this.$emit('change-component', {
                    to: 'transaction-confirmation',
                    from: 'send-transaction-form',
                    data: {
                        ...data,
                        fee: this.$fWallet.WEIToFTM(this.$fWallet.getTransactionFee(this.gasPrice)),
                    },
                });
            }
        },

        onPreviousBtnClick() {
            this.$emit('change-component', {
                to: 'blockchain-picker-form',
                from: 'send-transaction-form',
            });
        },

        onAccountPicked() {
            // this.$refs.form.reset();
            // this.$refs.form.checkValidity();
        },

        onEntireBalanceClick() {
            const { token } = this;

            if (token.address) {
                this.amount =
                    this.maxRemainingErc20TokenBalance > 0 ? this.maxRemainingErc20TokenBalance.toString() : '0';
            } else {
                this.amount = this.maxRemainingBalance > 0 ? this.maxRemainingBalance.toString() : '0';
            }
        },
    },
};
</script>

<style lang="scss">
.send-transaction-form {
    .available-balance {
        margin-bottom: 24px;

        .ab-label {
            font-weight: bold;
        }

        .ab-balance {
            font-size: 26px;
            text-align: right;
        }
    }
}
</style>
