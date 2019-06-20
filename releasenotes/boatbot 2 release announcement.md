[status] work has started on boatbot lazer (v2.0.0a), for which the source can be viewed at https://github.com/0xg0ldpk3rx0/SupportBot
please note this is a source-available project and not an open source project. all copyright rights remain reserved. (also thank you @joshbakerfromohio for hosting the repo)
the following things will never be made available for public viewing: boatbot v1 code and the website code

the reason why i'm doing this rewrite is so we can continue to grow beyond the shard limit of 2500 servers, and so i can maintain the boatbot service more easily (with your help and bug reports). i started the v1 code as a beginner in javascript and it's too difficult to manage now, so it's time to move on from the 13k lines of boatbot v1 spaghetti.

the structure of the boatbot lazer migration will be as follows:
0. boatbot v1 and lazer will run on the boatbot account at the same time
1. a feature from v1 will be ported to lazer
2. this feature will be tested on betabot for issues
3. the feature will be released on lazer software and disabled on v1 software
4. go back to step 1 until all core features are migrated

during this time, you may see 2 different (or duplicate) responses to the same command as both v1 and lazer are running concurrently. not all features will be ported before v1 is disabled permanently on the boatbot account. some features from v1 will not be available in lazer. the migration will take place over a long period of time; it could be anywhere from 2 months to 6 months but I would like to have this done by the end of 2018.

when the v1 bot is deprecated and removed from service on the boatbot account:
- we will broadcast a single-message PSA in all servers
- bot adding will become public again until we reach about 7k servers or until an unforseen scaling problem becomes apparent
- a new [BOT] account will be created for v1 boatbot but the software will not be maintained or updated (this is for people who need some obscure, deprecated feature from v1)
- tracking will also be permanently disabled on the v1 account. 
- server preferences for v1 and lazer will be separated so for example, a v1 `!personalizations on` will have no effect on lazer settings
- the v1 bot will be permanently shut down 6 months after the migration is complete.
- we will stop processing requests for v1 data 1 year after the migration is complete.

we will not be able to provide boatbot+ service/sales during the migration period. boatbot+ purchases with active time remaining have already been refunded partially according to the agreement at <https://iaace.gg/refunds.txt> via original purchase method. Donations will not be refunded.

thank you for sticking with us! the reason why i decided to write, maintain, and accept feature requests for v1 were because of growing number of osu community members who supported us. the reason why im rewriting the bot is because im reminded of how many people still appreciate boatbot, even when the boat leaks, and even when people jump ship. So many of you sent server invitations to me while public adding was disabled! i had a critical moment with my staff a few months ago where we discussed where we should take the boatbot project, and the idea of stopping all development permanently was on the table. without you, we would not have boatbot v1, and we surely would not have boatbot lazer. i know we can all look forward to a brighter future.

the first command to be ported will be the statsplus command, know by aliases such as (but not limited to):
[internal v2] light api response caching
[feature v2] `!statsplus`, `!sp`, `!osu`, `!taiko`, `!spt`, `!ctb`, `!spc`, `!mania`
[feature v2] the statsplus family of commands will now show +HD category score counts
[feature v2] using the statsplus command with a carrot `^` will pull the information for the user queried in the last command. This will not work for commands processed by the v1 bot because the lazer bot will use the new website link format while the v1 bot uses the old format.
[feature v2] username shortcuts for when someone's name is too complicated to remember. this was a really helpful feature for LoL in SupportBot (from which v2 code is forked from), where names could contain unicode characters. so if you set a shortcut like `!ss $friend1 IlIllIli1Ili`, you can use it to do `!taiko $friend1` instead of having to remember, type out, or copy and paste IlIllIli1Ili. or you can just give your friend a silly nickname. these shortcuts are preferences saved for each discord account (so not server-wide). shortcuts must start with a `$`
- `!shortcuts` / `!shortcut` displays all shortcuts
- `!setshortcut $<shortcut name> <actual osu ign>` / `!ss $<shortcut name> <actual osu ign>` / `!addshortcut ...`
- `!removeshortcut $<shortcut name>`
- `!removeallshortcuts`

I will make an announcement when the above features are live.

[migrated]