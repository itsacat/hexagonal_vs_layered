class PaymentOfFirstOrder {
    // @pslotinsky А здесь наоборот :) Раздражает, что метод назван как существительное
    public static async paymentOfFirstOrder(
            subscription, successRedirectURL, failureRedirectURL
        ) {
        let order: FirstOrder =
            await OrderFactory.createFirstOrderBySubscription(subscription);

        try {
            let urlForFirstPayment = await order.makePaymentInAcquiring(
                successRedirectURL, failureRedirectURL
            );
        } catch (error) {
            if (error instanceof CreationOfAcquiringOrderFailedError) {
                await OrderRepository.save(order);
                // Тут конечно можно создать эррор уровня use case, но это зашквар.
                throw error;
            } else {
                throw error;
            }
        }

        await OrderRepository.update(order);

        return urlForFirstPayment;
    }


    public static async creationAcquiringOrderCallback(order) {
        await order.readAcquiringOrderData();
        OrderRepository.save(order);
    }


    // ОБРАТИТЕВНИВАНИЕ: я вынес эту бизнес логику в use case
    public static async onFirstOrderPaid(order) {
        let user = UserRepository.getUserByOrder(order.id);
        user.createCardByOrder(order);
        UserRepository.save(user);
    }
}
