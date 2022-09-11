import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { Paese } from 'src/app/common/paese';
import { Purchase } from 'src/app/common/purchase';
import { Regione } from 'src/app/common/regione';
import { CartService } from 'src/app/services/cart.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { Luv2ShopFormService } from 'src/app/services/luv2-shop-form.service';
import { Luv2ShopValidators } from 'src/app/validators/luv2-shop-validators';
import { validateLocaleAndSetLanguage } from 'typescript';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {

  checkoutFormGroup!: FormGroup;

  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardMonths: number[]= [];
  creditCardYears: number[]= [];

  paesi: Paese[] = [];

  shippingAddressRegioni: Regione[]= [];
  billingAddressRegioni: Regione[]= [];


  constructor(private formBuilder : FormBuilder,
              private luv2ShopFormService: Luv2ShopFormService,
              private cartService: CartService,
              private checkoutService: CheckoutService,
              private router: Router) { }

  ngOnInit() : void{

    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('', 
                                  [Validators.required, 
                                   Validators.minLength(2),
                                   Luv2ShopValidators.notOnlyWhitespace]),

        lastName: new FormControl('', 
                                  [Validators.required, 
                                   Validators.minLength(2),
                                   Luv2ShopValidators.notOnlyWhitespace]),
        email: new FormControl('', 
                              [Validators.required, 
                               Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'),
                               Luv2ShopValidators.notOnlyWhitespace])
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('', 
                                [Validators.required, 
                                Validators.minLength(2),
                                Luv2ShopValidators.notOnlyWhitespace]),
        city: new FormControl('', 
                              [Validators.required, 
                              Validators.minLength(2),
                              Luv2ShopValidators.notOnlyWhitespace]),
        regione: new FormControl('', [Validators.required]),
        paese: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', 
                                [Validators.required, 
                                Validators.minLength(2),
                                Luv2ShopValidators.numeric,
                                Luv2ShopValidators.notOnlyWhitespace])
      }),
      billingAddress: this.formBuilder.group({
        street: new FormControl('', 
                                [Validators.required, 
                                Validators.minLength(2),
                                Luv2ShopValidators.notOnlyWhitespace]),
        city: new FormControl('', 
                              [Validators.required, 
                              Validators.minLength(2),
                              Luv2ShopValidators.notOnlyWhitespace]),
        regione: new FormControl('', [Validators.required]),
        paese: new FormControl('', [Validators.required]),
        zipCode: new FormControl('', 
                                [Validators.required, 
                                Validators.minLength(2),
                                //Luv2ShopValidators.numeric,
                                Luv2ShopValidators.notOnlyWhitespace])
      }),
      creditCard: this.formBuilder.group({
        cardType: new FormControl('', [Validators.required]),
        nameOnCard: new FormControl('', 
                                  [Validators.required, 
                                  Validators.minLength(2),
                                  Luv2ShopValidators.notOnlyWhitespace]),
        cardNumber: new FormControl('',
                                  [Validators.required,  
                                   Validators.pattern('[0-9]{16}'),
                                   Luv2ShopValidators.notOnlyWhitespace]),
        securityCode: new FormControl('',
                                    [Validators.required,  
                                    Validators.pattern('[0-9]{3}')]),
        expirationMonth: [''],
        expirationYear: ['']
      })
    });

    //popolamento dei mesi 
    const startMonth: number = new Date().getMonth() + 1;
    console.log("startMonth: "+ startMonth);

    this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retrieved credit card months:" + JSON.stringify(data));
        this.creditCardMonths = data;
      }
    );

    //popolamento anni
    this.luv2ShopFormService.getCreditCardYears().subscribe(
      data => {
        console.log("Retrieved credit card years:" + JSON.stringify(data));
        this.creditCardYears = data;
      }
    );
  
    //popolamento Paesi
    this.luv2ShopFormService.getPaesi().subscribe(
      data => {
        console.log("retrieved paesi: "+JSON.stringify(data));
        this.paesi = data;
      }
    );
  

      this.reviewCartDetails();

  }

  get firstName(){return this.checkoutFormGroup.get('customer.firstName');}
  get lastName(){return this.checkoutFormGroup.get('customer.lastName');}
  get email(){return this.checkoutFormGroup.get('customer.email');}

  get shippingAddressStreet(){return this.checkoutFormGroup.get('shippingAddress.street');}
  get shippingAddressCity(){return this.checkoutFormGroup.get('shippingAddress.city');}
  get shippingAddressRegione(){return this.checkoutFormGroup.get('shippingAddress.regione');}
  get shippingAddressPaese(){return this.checkoutFormGroup.get('shippingAddress.paese');}
  get shippingAddressZipCode(){return this.checkoutFormGroup.get('shippingAddress.zipCode');}

  get billingAddressStreet(){return this.checkoutFormGroup.get('billingAddress.street');}
  get billingAddressCity(){return this.checkoutFormGroup.get('billingAddress.city');}
  get billingAddressRegione(){return this.checkoutFormGroup.get('billingAddress.regione');}
  get billingAddressPaese(){return this.checkoutFormGroup.get('billingAddress.paese');}
  get billingAddressZipCode(){return this.checkoutFormGroup.get('billingAddress.zipCode');}

  get creditCardType(){return this.checkoutFormGroup.get('creditCard.cardType');}
  get creditCardNameOnCard(){return this.checkoutFormGroup.get('creditCard.nameOnCard');}
  get creditCardNumber(){return this.checkoutFormGroup.get('creditCard.cardNumber');}
  get creditCardSecurityCode(){return this.checkoutFormGroup.get('creditCard.securityCode');}


  reviewCartDetails() {

    //subscribe al cart service per quantità 
    this.cartService.totalQuantity.subscribe(
      totalQuantity => this.totalQuantity= totalQuantity
    );

    //subscribe al service per prezzo
    this.cartService.totalPrice.subscribe(
      totalPrice => this.totalPrice= totalPrice
    );

  }


  copyShippingAddressToBillingAddress(event) {

    if (event.target.checked) {
      this.checkoutFormGroup.controls['billingAddress']
            .setValue(this.checkoutFormGroup.controls['shippingAddress'].value);

            //bug fixing codice per le regioni
            this.billingAddressRegioni = this.shippingAddressRegioni;
    }
    else {
      this.checkoutFormGroup.controls['billingAddress'].reset();

      //bug fixing codice per regioni
      this.billingAddressRegioni = [];
    }
    
  }  

  onSubmit(){
    console.log("Handling the submit button");

    if(this.checkoutFormGroup.invalid){
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }
    
    //settaggio ordine
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    //ottenimento degli elementi ordine
    const cartItems = this.cartService.cartItems;

    //creazione dell'orderItems da cartItems
    /*vi sono due modi per ottenere i dati: --maniera più lunga
    let orderItems: OrderItem[] = [];
    for(let i=0; i< cartItems.length; i++){
      orderItems[i] = new OrderItem(cartItems[i]);
    }*/

    //-- maniera più corta
    let orderItems: OrderItem[]= cartItems.map(tempCartItem => new OrderItem(tempCartItem));

    //settaggio acquisto
    let purchase = new Purchase();

    //popolamento acquisto - con cliente
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;
    

    //popolamento acquisto - con indirizzo spedizione
    purchase.shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
    const shippingState: Regione = JSON.parse(JSON.stringify(purchase.shippingAddress.state));
    const shippingCountry: Paese = JSON.parse(JSON.stringify(purchase.shippingAddress.country));
    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    //popolamento acquisto - con indirizzo fatturazione
    purchase.billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
    const billingState: Regione = JSON.parse(JSON.stringify(purchase.billingAddress.state));
    const billingCountry: Paese = JSON.parse(JSON.stringify(purchase.billingAddress.country));
    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;

    //popolamento acquisto - con ordine ed elementi dell'ordine
    purchase.order = order;
    purchase.orderItems = orderItems;

    //chiamata alle nostre REST API del backend tramite il CheckoutService
    this.checkoutService.placeOrder(purchase).subscribe({
        //caso di successo
        next: response => {
          alert(`Your order has been received. \n Order Tracking number: ${response.orderTrackingNumber}`)
        
          //reset del carrello
          this.resetCart();

        },
        //caso di errore, insuccesso
        error: err =>{
          alert(`There was an error: ${err.message}`);
        }
        
      }
    );



    /*
    console.log(this.checkoutFormGroup.get('customer').value);
    console.log("The email address is:"+ this.checkoutFormGroup.get('customer').value.email);

    console.log("The Paese of shipping address is:"+ this.checkoutFormGroup.get('shippingAddress').value.paese.name);
    console.log("The Regione of shipping address is:"+ this.checkoutFormGroup.get('shippingAddress').value.regione.name);
    */
  }

  resetCart() {
    //reset dei dati del carrello
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);

    //reset del form
    this.checkoutFormGroup.reset();


    //navigazione riportata alla lista di prodotti
    this.router.navigateByUrl("/products");

  }

  handleMonthsAndYears(){

    const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');

    const currentYear: number = new Date().getFullYear();
    const selectedYear: number = Number(creditCardFormGroup.value.expirationYear);

    //se l'anno selezionato sarà uguale a quello corrente verrà impostato 
    //come mese iniziale quello attuale

    let startMonth: number;

    if(currentYear == selectedYear){
      startMonth = new Date().getMonth() + 1;
    }
    else startMonth = 1;

    this.luv2ShopFormService.getCreditCardMonths(startMonth).subscribe(
      data=> {
      console.log("retrieved credit card months: "+ JSON.stringify(data));
      this.creditCardMonths = data;
      }
    );
  }

  getRegioni(formGroupName: string){

    const formGroup = this.checkoutFormGroup.get(formGroupName);

    //const countryCode = formGroup.value.country.code;
    const paeseCode = formGroup.value.paese.code;
    const paeseName = formGroup.value.paese.name;
    
    //console.log(`${formGroupName} country code: ${countryCode}`);
    console.log(`${formGroupName} code paese: ${paeseCode}`)!;
    console.log(`${formGroupName} nome paese: ${paeseName}`)!;

    this.luv2ShopFormService.getRegioni(paeseCode).subscribe(
      data => {

        if(formGroupName === 'shippingAddress'){

          this.shippingAddressRegioni = data;

        }
        else{
          this.billingAddressRegioni = data;
        }
      
        //selezione del primo elemento di default
        formGroup.get('regione').setValue(data[0]);
        
      }
    );

  }

}
