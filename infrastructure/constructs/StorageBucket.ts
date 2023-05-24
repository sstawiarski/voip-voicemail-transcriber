import { storageBucket, storageBucketIamMember } from "@cdktf/provider-google";
import { Construct } from "constructs";
export interface StorageBucketConfig extends storageBucket.StorageBucketConfig {
	permissions: { member: string; role: string }[];
}
export class StorageBucket extends storageBucket.StorageBucket {
	constructor(scope: Construct, name: string, { permissions, ...config }: StorageBucketConfig) {
		super(scope, name, config);

		for (const [index, { member, role }] of permissions.entries()) {
			new storageBucketIamMember.StorageBucketIamMember(this, `${index}-${this.node.id}-perms`, {
				bucket: this.name,
				member,
				role
			});
		}
	}
}
