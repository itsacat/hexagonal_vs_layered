class User {
    // Это можно делать тут или в domain/UserService
    public static async onFirstOrderPaid(order) {
        let user = UserRepository.getUserByOrder(order.id);
        user.createCardByOrder(order);
        UserRepository.save(user);
    }


    public async subscribe(
        project: Project, amount: number, successRedirectURL, failureRedirectURL
    ): Promise<Subscription> {
        if (project.isDraft() && !project.isCreator(this)) {
            throw new ProjectDisabledError();
        }

        const subscription: Subscription =
            await SubscriptionFactory.create(this.id, project.id);


        subscription.amount.value = amount;
        subscription.payDate.value = new Date();


        if (this.hasCard) {
            await this.makeRecurrentOrder_(subscription);

            SubscriptionRepository.add(subscription);
        } else {
            subscription.status = 'waitingForFirstPayment';

            let urlForFirstPayment = await this.makeFirstOrder_(
                subscription, successRedirectURL, failureRedirectURL
            );

            SubscriptionRepository.add(subscription);
            return urlForFirstPayment;
        }
    }


    public async restoreSubscription(
        subscription: Subscription, amount: number,
        successRedirectURL, failureRedirectURL
    ): Promise<Subscription> {
        subscription.amount.value = amount;
        // А разве payDate мы не должны поменять?


        if (this.hasCard) {
            let isPaidInThisMonth = subscription.isPaidInMonth(new Date());

            if (isPaidInThisMonth) {
                subscription.enable();
            } else {
                // нужно обсудить с продуктологами, нужно ли списывать в этот момент?
                await this.makeRecurrentOrder_(subscription);
            }
            SubscriptionRepository.add(subscription);
        } else {
            subscription.status = 'waitingForFirstPayment';

            let urlForFirstPayment = await this.makeFirstOrder_(
                subscription, successRedirectURL, failureRedirectURL
            );

            SubscriptionRepository.add(subscription);
            return urlForFirstPayment;
        }
    }


    private async makeFirstOrder_(
            subscription, successRedirectURL, failureRedirectURL
        ) {
        let order: FirstOrder =
            await OrderFactory.createFirstOrderBySubscription(subscription);

        let urlForFirstPayment = await order.makePaymentInAcquiring(
            successRedirectURL, failureRedirectURL
        );

        await OrderRepository.add(order);

        return urlForFirstPayment;
    }


    private async makeRecurrentOrder_(subscription) {
        let order: RecurrentOrder =
            await OrderFactory.createRecurrentBySubscription(subscription);

        await order.makePaymentInAcquiring();

        await OrderRepository.add(order);
    }
}
