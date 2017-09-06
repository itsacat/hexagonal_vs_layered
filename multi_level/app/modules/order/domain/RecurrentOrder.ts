class RecurrentOrder {
    public async makePaymentInAcquiring() {
        await this.createAcquiringOrder_();
        await this.payAcquiringOrder_();
        await this.readAcquiringOrderData_();
        // внутри readAcquiringOrderData_ бросается событие RecurrentOrderPaid
    }
}
