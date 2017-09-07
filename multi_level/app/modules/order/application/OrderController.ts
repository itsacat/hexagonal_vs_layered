class OrderController extends Controller {
    creationAcquiringOrderCallback(ctx) {
        let acquiringOrderNumber = ctx.request.query.orderNumber;
        let order = OrderRepository.getById(acquiringOrderNumber);

        if (!order) {
            // бросить ошибку
            return;
        } else if (order.type == orderTypes.RECURRENT) {
            // нужно описать зачем тут мы делаем return
            return;
        }

        // @melfimov странный if, это должен быть метод в FirstOrder, который в FirstOrder делает что-то,
        // а в других подклассах не делает. В клиентском коде нам вообще не должно быть дела до того какой тип у order
        if (order instanceof FirstOrder) {
            try {
                await(order.readAcquiringOrderData());
            } catch(error) {
                if (error instanceof OrderIsNotAvailableForPaymentError) {
                    // бросит ошибку
                }
            }
            OrderRepository.save(order);
        }

        return null;
    }
}
