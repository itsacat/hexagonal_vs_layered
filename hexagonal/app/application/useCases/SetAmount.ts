class SetAmount {
    public static async setAmount(
            userId, projectId, amount
        ) {
        const project: Project = await ProjectRepository.getById(projectId);
        const user: User = await UserRepository.getById(userId);

        let subscription: Subscription =
            await user.getSubscriptionByProject(project);

        subscription.amount.value = amount;

        await SubscriptionRepository.save(subscription);
    }
}
