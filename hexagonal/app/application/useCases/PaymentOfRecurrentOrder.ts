class PaymentOfRecurrentOrder {
    public static async paymentOfRecurrentOrder(subscription) {
        let order: RecurrentOrder =
            await OrderFactory.createRecurrentBySubscription(subscription);

        try {
            await order.makePaymentInAcquiring(
                successRedirectURL, failureRedirectURL
            );
        } catch (error) {
            if (error instanceof PaymentError) {
                await OrderRepository.save(order);
                // Тут конечно можно создать эррор уровня use case, но это зашквар.
                throw error;
            } else {
                throw error;
            }
        }

        await OrderRepository.update(order);
    }
}
