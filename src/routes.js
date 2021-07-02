import NotFound from './views/NotFound/NotFound.vue';
import Home from './views/Home/Home.vue';
import Welcome from './views/Welcome/Welcome.vue';
import CreateAccount from './views/CreateAccount/CreateAccount.vue';
import RestoreAccount from './views/RestoreAccount/RestoreAccount.vue';
import Account from './views/Account/Account.vue';
import Dashboard from './views/Dashboard/Dashboard.vue';
import AccountSend from './views/AccountSend.vue';
import AccountReceive from './views/AccountReceive.vue';
// import AccountStake from './views/AccountStake.vue';
import LedgerAccounts from './views/LedgerAccounts/LedgerAccounts.vue';
import AccountHistory from './views/AccountHistory/AccountHistory.vue';
import Settings from './views/Settings/Settings.vue';
import Wallet from './views/Wallet/Wallet.vue';
import AccountSendErc20 from '@/views/AccountSendErc20/AccountSendErc20.vue';
import Eip from '@/views/Eip/Eip';
import EipWelcome from '@/views/EipWelcome/EipWelcome';
import EipSendTransaction from '@/views/EipSendTransaction/EipSendTransaction';
import EipSelectAccounts from '@/views/EipSelectAccounts/EipSelectAccounts';

export const routes = [
    {
        name: 'home',
        path: '/',
        component: Home,
        children: [
            {
                name: 'welcome',
                path: '',
                component: Welcome,
            },
            {
                name: 'create-account',
                path: '/account/create',
                component: CreateAccount,
            },
            {
                name: 'restore-account',
                path: '/account/restore',
                component: RestoreAccount,
            },
            {
                name: 'ledger-accounts',
                path: '/ledger-accounts',
                component: LedgerAccounts,
            },
        ],
    },
    {
        name: 'eip',
        path: '/',
        component: Eip,
        children: [
            {
                name: 'eip-welcome',
                path: '/eip-welcome',
                component: EipWelcome,
            },
            {
                name: 'eip-select-accounts',
                path: '/eip-select-accounts/:site',
                component: EipSelectAccounts,
            },
            {
                name: 'eip-send-transaction',
                path: '/eip-send-transaction/:id',
                component: EipSendTransaction,
            },
        ],
    },
    {
        name: 'wallet',
        path: '/',
        component: Wallet,
        children: [
            {
                name: 'account',
                path: '/account/:address',
                component: Account,
                children: [
                    {
                        name: 'account-history',
                        path: '',
                        component: AccountHistory,
                        meta: { dontScrollToTop: true },
                    },
                    {
                        name: 'account-send',
                        path: 'send',
                        component: AccountSend,
                        meta: { dontScrollToTop: true },
                    },
                    {
                        name: 'account-send-erc20',
                        path: 'send',
                        component: AccountSendErc20,
                        meta: { dontScrollToTop: true },
                    },
                    {
                        name: 'account-receive',
                        path: 'receive',
                        component: AccountReceive,
                        meta: { dontScrollToTop: true },
                    },
                    /*
                    {
                        name: 'account-stake',
                        path: 'stake',
                        component: AccountStake,
                        meta: { dontScrollToTop: true },
                    },
                    */
                ],
            },
            {
                name: 'dashboard',
                path: '/dashboard',
                component: Dashboard,
            },
            {
                name: 'settings',
                path: '/settings',
                component: Settings,
            },
        ],
    },
    {
        name: 'not-found',
        path: '*',
        component: NotFound,
    },
];
