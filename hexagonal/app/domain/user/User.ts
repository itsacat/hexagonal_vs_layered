class User {
    public async subscribe(
        project: Project, amount: number
    ): Promise<Subscription> {
        if (project.isDraft() && !project.isCreator(this)) {
            throw new ProjectDisabledError;
        }

        const subscription: Subscription =
            await SubscriptionFactory.create(this.id, project.id);


        subscription.amount.value = amount;
        subscription.payDate.value = new Date();


        if (this.hasCard) {
            subscription.status = 'waitingForRecurrentOrder';
        } else {
            subscription.status = 'waitingForFirstOrder';
        }

        return subscription;
    }


    public async restoreSubscription(
        subscription: Subscription, amount: number
    ): Promise<Subscription> {
        subscription.amount.value = amount;
        // А разве payDate мы не должны поменять?


        if (this.hasCard) {
            let isPaidInThisMonth = subscription.isPaidInMonth(new Date());

            if (isPaidInThisMonth) {
                subscription.enable();
            } else {
                // нужно обсудить с продуктологами, нужно ли списывать в этот момент?
                subscription.status = 'waitingForRecurrentOrder';
            }
            SubscriptionRepository.add(subscription);
        } else {
            subscription.status = 'waitingForFirstOrder';
        }
    }
}
