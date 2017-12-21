class Subscription {
    // Это можно делать тут или в domain/SubscriptionService
    public static async onRecurrentOrderPaid(order) {
        let subscription =
            SubscriptionRepository.getById(order.subscriptionId);
        subscription.enable();
        SubscriptionRepository.save(subscription);

        // ОБРАТИТЕВНИВАНИЕ: Похорошему нужно вынести в прикладной уровень, по событию UserSubscribed
        // Но куда?
        if (user.isNotificationsLevelIsAll) {
            mail.sendFirstPayment(user.email, {
                userId: user.id,
                userName: user.firstName
            });
        }
    }


    // Это можно делать тут или в domain/SubscriptionService
    public static async onFirstOrderPaid(order) {
        let subscription =
            SubscriptionRepository.getById(order.subscriptionId);

        subscription.enable();

        SubscriptionRepository.save(subscription);

        // Спросить у продуктологов: Нужно ли высылать email?
    }


    public enable() {
        if (!this.enabled) {
            this.enabled = true;
            this.setPayDate(new Date());
            // Бросается событие UserSubscribed
        }
    }
}
