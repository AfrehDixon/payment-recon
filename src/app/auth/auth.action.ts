interface Merchant {
  id: number;
  name: string;
  balance: number;
  status: string;
  phone: string;
  email: string;
}

export class AdminLogin {
    static readonly type = '[auth] AdminLogin]';
    constructor(public readonly payload:any) {}
}


export class Logout {
    static readonly type = '[auth] Logout]';
}

export class AutoLogin {
    static readonly type = '[auth] AutoLogin]';
}

export class SetAllMerchants {

  static readonly type = '[Auth] Set All Merchants';

  constructor(public merchants: Merchant[]) {}

}
