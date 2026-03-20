declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    order_id?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    notes?: {
      [key: string]: string;
    };
    theme?: {
      color?: string;
    };
    method?: {
      upi?: boolean;
      card?: boolean;
      netbanking?: boolean;
      wallet?: boolean;
      emi?: boolean;
      paylater?: boolean;
    };
    config?: {
      upi?: {
        flow?: string;
        apps?: string[];
        timeout?: number;
      };
      display?: {
        hide?: Array<{
          method: string;
          type?: string;
          apps?: string[];
          flows?: string[];
          issuers?: string[];
          modes?: string[];
        }>;
        blocks?: {
          [key: string]: {
            name?: string;
            instruments: Array<{
              method: string;
              type?: string;
              apps?: string[];
              flows?: string[];
              issuers?: string[];
              modes?: string[];
            }>;
          };
        };
        sequence?: string[];
        preferences?: {
          show_default_blocks?: boolean;
        };
      };
    };
    modal?: {
      ondismiss?: () => void;
    };
  }

  interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface RazorpayCheckout {
    open(options: RazorpayOptions): Promise<RazorpayResponse>;
  }

  const RazorpayCheckout: RazorpayCheckout;
  export default RazorpayCheckout;
} 