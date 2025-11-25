const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
    AttachmentBuilder,
    ChannelType,
    ActivityType,
    REST,
    Routes
} = require('discord.js');
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
//                    Ishhs GREENVILLE ROLEPLAY BOT v3.5
// ═══════════════════════════════════════════════════════════════════════════════

// Load configuration
let config;
try {
    const configFile = fs.readFileSync('./config.yml', 'utf8');
    config = yaml.load(configFile);
} catch (e) {
    console.error('❌ Error loading config.yml:', e);
    console.log('Creating default config.yml...');
    createDefaultConfig();
    process.exit(1);
}

// Initialize logging system
const LOGS_DIR = path.dirname(config.logging?.file_logging?.log_file_path || './logs/bot.log');
const LOG_FILE = config.logging?.file_logging?.log_file_path || './logs/bot.log';

if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Custom logger function
function logToFile(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data
    };
    
    const logString = `[${timestamp}] [${level}] ${message}${data ? ' | ' + JSON.stringify(data) : ''}\n`;
    
    // Console logging
    if (config.logging?.terminal_logging?.enabled) {
        if (level === 'ERROR' && config.logging?.terminal_logging?.log_errors) {
            console.error(logString.trim());
        } else if (level === 'WARN' && config.logging?.terminal_logging?.log_warnings) {
            console.warn(logString.trim());
        } else if (level === 'INFO' && config.logging?.terminal_logging?.log_info) {
            console.log(logString.trim());
        } else if (level === 'COMMAND' && config.logging?.terminal_logging?.log_commands) {
            console.log(logString.trim());
        }
    }
    
    // File logging
    if (config.logging?.file_logging?.enabled) {
        if (level === 'ERROR' && !config.logging?.file_logging?.log_errors) return;
        if (level === 'WARN' && !config.logging?.file_logging?.log_warnings) return;
        if (level === 'INFO' && !config.logging?.file_logging?.log_info) return;
        if (level === 'COMMAND' && !config.logging?.file_logging?.log_commands) return;
        
        try {
            // Check file size and rotate if needed
            if (fs.existsSync(LOG_FILE)) {
                const stats = fs.statSync(LOG_FILE);
                const fileSizeMB = stats.size / (1024 * 1024);
                
                if (fileSizeMB > (config.logging?.file_logging?.max_file_size_mb || 10)) {
                    rotateLogFiles();
                }
            }
            
            fs.appendFileSync(LOG_FILE, logString);
        } catch (error) {
            console.error('Error writing to log file:', error);
        }
    }
}

function rotateLogFiles() {
    const maxFiles = config.logging?.file_logging?.max_log_files || 5;
    
    // Delete oldest file if at max
    const oldestFile = `${LOG_FILE}.${maxFiles}`;
    if (fs.existsSync(oldestFile)) {
        fs.unlinkSync(oldestFile);
    }
    
    // Rotate files
    for (let i = maxFiles - 1; i >= 1; i--) {
        const oldFile = i === 1 ? LOG_FILE : `${LOG_FILE}.${i}`;
        const newFile = `${LOG_FILE}.${i + 1}`;
        
        if (fs.existsSync(oldFile)) {
            fs.renameSync(oldFile, newFile);
        }
    }
    
    // Create new log file
    fs.writeFileSync(LOG_FILE, '');
}

function createDefaultConfig() {
    const defaultConfig = {
        bot_token: "YOUR_BOT_TOKEN_HERE",
        guild_id: "YOUR_GUILD_ID_HERE",
        presence: {
            status: "online",
            activity_type: "WATCHING",
            activity_text: "Ishhs Greenville Roleplay",
            streaming_url: "https://twitch.tv/your_channel"
        },
        roles: {
            infraction_permission: "INFRACTION_ROLE_ID_HERE",
            staff_infraction_permission: "STAFF_INFRACTION_ROLE_ID_HERE",
            staff_role: "STAFF_ROLE_ID_HERE",
            moderator_role: "MODERATOR_ROLE_ID_HERE",
            admin_role: "ADMIN_ROLE_ID_HERE"
        },
        owners: ["OWNER_USER_ID_1_HERE", "OWNER_USER_ID_2_HERE"],
        infraction_types: [
            {
                name: "Infraction 1",
                display_name: "Infraction 1",
                role_id: "INFRACTION_1_ROLE_ID_HERE",
                color: 0xFFFF00,
                emoji: "⚠️",
                description: "Minor violation"
            },
            {
                name: "Infraction 2",
                display_name: "Infraction 2",
                role_id: "INFRACTION_2_ROLE_ID_HERE",
                color: 0xFFA500,
                emoji: "⛔",
                description: "Moderate violation"
            },
            {
                name: "Infraction 3",
                display_name: "Infraction 3",
                role_id: "INFRACTION_3_ROLE_ID_HERE",
                color: 0xFF0000,
                emoji: "🔨",
                description: "Major violation"
            }
        ],
        infraction_messages: {
            civilian: "You have received an infraction for violating server rules. Please review our community guidelines and ensure this behavior does not continue. Repeated violations may result in further disciplinary action.",
            staff: "You have received a staff infraction for violating staff conduct policies. As a staff member of Ishhs Greenville Roleplay, you are held to higher standards of behavior and professionalism. This infraction cannot be removed and will remain permanently on your record."
        },
        infraction_embed: {
            footer_line_1: "If you think this infraction was a mistake please open a ticket.",
            footer_line_2: "Property of Ishhs Greenville Roleplay.",
            show_thumbnail: true,
            thumbnail_url: "",
            include_timestamp: true,
            send_dm: true,
            dm_failed_message: "Could not DM user - they may have DMs disabled."
        },
        logging: {
            channel_id: "LOG_CHANNEL_ID_HERE",
            channel_name: "bot-logs",
            monitor_interval: 5,
            detailed_logs: true,
            log_member_events: true,
            colors: {
                infraction: 0xFF0000,
                staff_infraction: 0x8B0000,
                infraction_removed: 0x00FF00,
                backup_created: 0x00FF00,
                backup_restored: 0x0099FF,
                antiraid_triggered: 0xFF0000,
                member_join: 0x00FF00,
                member_leave: 0xFF0000,
                error: 0xFF0000,
                warning: 0xFFA500,
                info: 0x0099FF
            }
        },
        anti_raid: {
            enabled: true,
            join_threshold: 5,
            time_window: 10,
            punishment: "kick",
            ban_duration_days: 0,
            delete_message_days: 1,
            enable_verification: true,
            verification_role_id: "VERIFICATION_ROLE_ID_HERE",
            auto_disable_after_minutes: 30,
            whitelisted_roles: [],
            alert_channel_id: "",
            ping_roles_on_raid: [],
            raid_alert_message: "🚨 **RAID DETECTED** - Anti-raid protection activated!"
        },
        backup: {
            max_backups: 10,
            storage_path: "./backups",
            auto_backup_interval_hours: 24,
            include: {
                roles: true,
                channels: true,
                permissions: true
            },
            notify_on_auto_backup: true
        },
        commands: {
            enabled: {
                infraction: true,
                staffinfraction: true,
                viewinfractions: true,
                removeinfraction: true,
                clearinfractions: true,
                infractionstats: true,
                bulkinfraction: true,
                exportinfractions: true,
                editinfraction: true,
                backup: true,
                restore: true,
                listbackups: true,
                deletebackup: true,
                backupinfo: true,
                antiraid: true,
                antiraidstatus: true,
                clearcommands: true
            },
            cooldown: {
                infraction: 3,
                staffinfraction: 3,
                viewinfractions: 2,
                removeinfraction: 3,
                clearinfractions: 5,
                backup: 60,
                restore: 120,
                antiraid: 5,
                clearcommands: 60
            },
            ephemeral_responses: {
                infraction: false,
                staffinfraction: false,
                viewinfractions: true,
                removeinfraction: true,
                backup: true,
                restore: true,
                listbackups: true,
                antiraid: true,
                clearcommands: true
            }
        },
        notifications: {
            notification_channel_id: "NOTIFICATION_CHANNEL_ID_HERE",
            notify_on_startup: true,
            startup_message: "✅ Ishhs Greenville Roleplay bot is online!",
            notify_on_shutdown: true,
            shutdown_message: "🔴 Bot shutting down...",
            notify_on_error: true
        },
        security: {
            max_evidence_file_size: 10,
            allowed_evidence_types: ["image/png", "image/jpeg", "image/jpg", "image/gif", "video/mp4", "application/pdf"],
            min_reason_length: 10,
            max_reason_length: 500
        },
        advanced: {
            debug_mode: false,
            data_files: {
                infractions: "./infractions.json"
            },
            auto_save_interval: 300
        },
        custom_messages: {
            no_permission: "❌ You do not have permission to use this command.",
            invalid_infraction_id: "❌ Invalid infraction ID.",
            infraction_removed_success: "✅ Infraction removed successfully.",
            cannot_remove_staff_infraction: "❌ Staff infractions cannot be removed.",
            backup_created_success: "✅ Backup created successfully!",
            backup_restored_success: "✅ Backup restored successfully!",
            no_backups_found: "❌ No backups found.",
            antiraid_enabled: "✅ Anti-raid enabled.",
            antiraid_disabled: "🔴 Anti-raid disabled.",
            command_cooldown: "⏱️ Cooldown: wait {time} seconds.",
            error_occurred: "❌ An error occurred.",
            commands_cleared: "✅ Commands cleared and re-registered."
        }
    };
    fs.writeFileSync('./config.yml', yaml.dump(defaultConfig, { indent: 2, lineWidth: -1 }));
    console.log('✅ Default config.yml created.');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const INFRACTIONS_FILE = config.advanced?.data_files?.infractions || './infractions.json';
const BACKUPS_DIR = config.backup.storage_path || './backups';
const BOT_BACKUP_DIR = './bot_backups';

if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
if (!fs.existsSync(BOT_BACKUP_DIR)) fs.mkdirSync(BOT_BACKUP_DIR, { recursive: true });
if (!fs.existsSync(INFRACTIONS_FILE)) fs.writeFileSync(INFRACTIONS_FILE, JSON.stringify({}));

let infractions = {};
try {
    infractions = JSON.parse(fs.readFileSync(INFRACTIONS_FILE, 'utf8'));
} catch (e) {
    infractions = {};
}

function saveInfractions() {
    fs.writeFileSync(INFRACTIONS_FILE, JSON.stringify(infractions, null, 2));
}

if (config.advanced?.auto_save_interval) {
    setInterval(() => {
        saveInfractions();
        if (config.advanced?.debug_mode) console.log('💾 Auto-saved infractions');
    }, config.advanced.auto_save_interval * 1000);
}

const cooldowns = new Map();
const joinTracker = new Map();
let raidModeActive = false;
let raidModeTimeout = null;

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
    if (config.presence) {
        const activityTypes = {
            'PLAYING': ActivityType.Playing,
            'STREAMING': ActivityType.Streaming,
            'LISTENING': ActivityType.Listening,
            'WATCHING': ActivityType.Watching,
            'COMPETING': ActivityType.Competing
        };

        client.user.setPresence({
            status: config.presence.status || 'online',
            activities: [{
                name: config.presence.activity_text || 'Ishhs Greenville Roleplay',
                type: activityTypes[config.presence.activity_type] || ActivityType.Watching,
                url: config.presence.activity_type === 'STREAMING' ? config.presence.streaming_url : undefined
            }]
        });
    }
    
    const guild = client.guilds.cache.get(config.guild_id);
    if (!guild) {
        console.error('❌ Guild not found!');
        return;
    }

    await registerCommands(guild);
    console.log('✅ Commands registered!');

    setupLogChannelMonitoring(guild);

    if (config.notifications?.notify_on_startup) {
        await sendNotification(guild, config.notifications.startup_message, 0x00FF00);
    }

    if (config.backup?.auto_backup_interval_hours > 0) {
        setInterval(async () => {
            await createAutoBackup(guild);
        }, config.backup.auto_backup_interval_hours * 60 * 60 * 1000);
    }

    await createBotBackup();
});

async function registerCommands(guild) {
    const commands = [];

    if (config.commands?.enabled?.infraction !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('infraction')
                .setDescription('Issue an infraction to a user')
                .addUserOption(option => option.setName('user').setDescription('User to infract').setRequired(true))
                .addStringOption(option =>
                    option.setName('type').setDescription('Infraction type').setRequired(true)
                        .addChoices(
                            { name: config.infraction_types[0].name, value: '0' },
                            { name: config.infraction_types[1].name, value: '1' },
                            { name: config.infraction_types[2].name, value: '2' }
                        ))
                .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(true))
                .addStringOption(option =>
                    option.setName('appealable').setDescription('Appealable?').setRequired(true)
                        .addChoices(
                            { name: 'Appealable', value: 'yes' },
                            { name: 'Unappealable', value: 'no' }
                        ))
                .addStringOption(option => option.setName('evidence1').setDescription('Evidence link 1'))
                .addStringOption(option => option.setName('evidence2').setDescription('Evidence link 2'))
                .addStringOption(option => option.setName('evidence3').setDescription('Evidence link 3'))
                .addAttachmentOption(option => option.setName('evidence_file1').setDescription('Evidence file 1'))
                .addAttachmentOption(option => option.setName('evidence_file2').setDescription('Evidence file 2'))
                .addAttachmentOption(option => option.setName('evidence_file3').setDescription('Evidence file 3'))
        );
    }
    
    if (config.commands?.enabled?.staffinfraction !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('staffinfraction')
                .setDescription('Issue infraction to staff (permanent)')
                .addUserOption(option => option.setName('user').setDescription('Staff member').setRequired(true))
                .addStringOption(option =>
                    option.setName('type').setDescription('Infraction type').setRequired(true)
                        .addChoices(
                            { name: config.infraction_types[0].name, value: '0' },
                            { name: config.infraction_types[1].name, value: '1' },
                            { name: config.infraction_types[2].name, value: '2' }
                        ))
                .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(true))
                .addStringOption(option =>
                    option.setName('appealable').setDescription('Appealable?').setRequired(true)
                        .addChoices(
                            { name: 'Appealable', value: 'yes' },
                            { name: 'Unappealable', value: 'no' }
                        ))
                .addStringOption(option => option.setName('evidence1').setDescription('Evidence link 1'))
                .addStringOption(option => option.setName('evidence2').setDescription('Evidence link 2'))
                .addStringOption(option => option.setName('evidence3').setDescription('Evidence link 3'))
                .addAttachmentOption(option => option.setName('evidence_file1').setDescription('Evidence file 1'))
                .addAttachmentOption(option => option.setName('evidence_file2').setDescription('Evidence file 2'))
                .addAttachmentOption(option => option.setName('evidence_file3').setDescription('Evidence file 3'))
        );
    }

    if (config.commands?.enabled?.viewinfractions !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('viewinfractions')
                .setDescription('View user infractions')
                .addUserOption(option => option.setName('user').setDescription('User').setRequired(true))
        );
    }

    if (config.commands?.enabled?.removeinfraction !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('removeinfraction')
                .setDescription('Remove an infraction')
                .addUserOption(option => option.setName('user').setDescription('User').setRequired(true))
                .addIntegerOption(option => option.setName('infraction_id').setDescription('Infraction ID').setRequired(true))
        );
    }

    if (config.commands?.enabled?.clearinfractions !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('clearinfractions')
                .setDescription('Clear all infractions')
                .addUserOption(option => option.setName('user').setDescription('User').setRequired(true))
                .addBooleanOption(option => option.setName('include_staff').setDescription('Clear staff infractions too (owner only)'))
        );
    }

    if (config.commands?.enabled?.infractionstats !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('infractionstats')
                .setDescription('View infraction statistics')
                .addUserOption(option => option.setName('user').setDescription('Specific user'))
        );
    }

    if (config.commands?.enabled?.bulkinfraction !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('bulkinfraction')
                .setDescription('Infract multiple users')
                .addStringOption(option => option.setName('user_ids').setDescription('User IDs (comma separated)').setRequired(true))
                .addStringOption(option =>
                    option.setName('type').setDescription('Infraction type').setRequired(true)
                        .addChoices(
                            { name: config.infraction_types[0].name, value: '0' },
                            { name: config.infraction_types[1].name, value: '1' },
                            { name: config.infraction_types[2].name, value: '2' }
                        ))
                .addStringOption(option => option.setName('reason').setDescription('Reason').setRequired(true))
                .addStringOption(option =>
                    option.setName('appealable').setDescription('Appealable?').setRequired(true)
                        .addChoices(
                            { name: 'Appealable', value: 'yes' },
                            { name: 'Unappealable', value: 'no' }
                        ))
        );
    }

    if (config.commands?.enabled?.exportinfractions !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('exportinfractions')
                .setDescription('Export infractions to JSON')
                .addUserOption(option => option.setName('user').setDescription('Specific user'))
        );
    }

    if (config.commands?.enabled?.editinfraction !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('editinfraction')
                .setDescription('Edit an infraction')
                .addUserOption(option => option.setName('user').setDescription('User').setRequired(true))
                .addIntegerOption(option => option.setName('infraction_id').setDescription('Infraction ID').setRequired(true))
                .addStringOption(option => option.setName('new_reason').setDescription('New reason'))
                .addStringOption(option => option.setName('new_evidence').setDescription('New evidence'))
                .addStringOption(option =>
                    option.setName('appealable').setDescription('Change appealable')
                        .addChoices(
                            { name: 'Appealable', value: 'yes' },
                            { name: 'Unappealable', value: 'no' }
                        ))
        );
    }

    if (config.commands?.enabled?.backup !== false) {
        commands.push(new SlashCommandBuilder().setName('backup').setDescription('Create server backup'));
    }

    if (config.commands?.enabled?.restore !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('restore')
                .setDescription('Restore server backup')
                .addStringOption(option => option.setName('backup_name').setDescription('Backup name').setRequired(true))
        );
    }

    if (config.commands?.enabled?.listbackups !== false) {
        commands.push(new SlashCommandBuilder().setName('listbackups').setDescription('List all backups'));
    }

    if (config.commands?.enabled?.deletebackup !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('deletebackup')
                .setDescription('Delete a backup')
                .addStringOption(option => option.setName('backup_name').setDescription('Backup name').setRequired(true))
        );
    }

    if (config.commands?.enabled?.backupinfo !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('backupinfo')
                .setDescription('View backup details')
                .addStringOption(option => option.setName('backup_name').setDescription('Backup name').setRequired(true))
        );
    }

    if (config.commands?.enabled?.antiraid !== false) {
        commands.push(
            new SlashCommandBuilder()
                .setName('antiraid')
                .setDescription('Toggle anti-raid')
                .addStringOption(option =>
                    option.setName('action').setDescription('Action').setRequired(true)
                        .addChoices(
                            { name: 'Enable', value: 'enable' },
                            { name: 'Disable', value: 'disable' }
                        ))
        );
    }

    if (config.commands?.enabled?.antiraidstatus !== false) {
        commands.push(new SlashCommandBuilder().setName('antiraidstatus').setDescription('View anti-raid status'));
    }

    if (config.commands?.enabled?.clearcommands !== false) {
        commands.push(new SlashCommandBuilder().setName('clearcommands').setDescription('Clear and re-register commands (owner)'));
    }

    if (config.commands?.enabled?.restartbot !== false) {
        commands.push(new SlashCommandBuilder().setName('restartbot').setDescription('Restart the bot (owner only)'));
    }

    await guild.commands.set(commands);
}

function setupLogChannelMonitoring(guild) {
    const interval = (config.logging?.monitor_interval || 5) * 1000;
    
    setInterval(async () => {
        try {
            const logChannel = guild.channels.cache.get(config.logging.channel_id);
            if (!logChannel) {
                const newChannel = await guild.channels.create({
                    name: config.logging.channel_name || 'bot-logs',
                    type: ChannelType.GuildText,
                    permissionOverwrites: [{
                        id: guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    }]
                });
                config.logging.channel_id = newChannel.id;
                fs.writeFileSync('./config.yml', yaml.dump(config, { indent: 2, lineWidth: -1 }));
                
                await newChannel.send({
                    embeds: [new EmbedBuilder()
                        .setTitle('⚠️ Log Channel Restored')
                        .setDescription('Log channel was deleted and has been recreated.')
                        .setColor(config.logging?.colors?.warning || 0xFFA500)
                        .setTimestamp()]
                });
            }
        } catch (error) {
            console.error('Error monitoring log channel:', error);
        }
    }, interval);
}

async function log(guild, embed) {
    if (!config.logging?.detailed_logs) return;
    
    try {
        const logChannel = guild.channels.cache.get(config.logging.channel_id);
        if (logChannel) await logChannel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error logging:', error);
    }
}

async function sendNotification(guild, message, color = 0x0099FF) {
    const channelId = config.notifications?.notification_channel_id;
    if (!channelId) return;

    try {
        const channel = guild.channels.cache.get(channelId);
        if (channel) {
            await channel.send({
                embeds: [new EmbedBuilder()
                    .setDescription(message)
                    .setColor(color)
                    .setTimestamp()]
            });
        }
    } catch (error) {
        console.error('Error sending notification:', error);
    }
}

async function createBotBackup() {
    try {
        const timestamp = Date.now();
        const backupData = {
            timestamp: timestamp,
            infractions: infractions,
            config: config
        };

        const backupName = `bot_backup_${timestamp}.json`;
        const backupPath = path.join(BOT_BACKUP_DIR, backupName);
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        const backupFiles = fs.readdirSync(BOT_BACKUP_DIR).filter(f => f.endsWith('.json'));
        if (backupFiles.length > 5) {
            const sortedBackups = backupFiles.sort();
            sortedBackups.slice(0, backupFiles.length - 5).forEach(file => {
                fs.unlinkSync(path.join(BOT_BACKUP_DIR, file));
            });
        }

        console.log(`💾 Bot backup: ${backupName}`);
    } catch (error) {
        console.error('Error creating bot backup:', error);
    }
}

client.on('guildMemberAdd', async (member) => {
    if (!config.anti_raid.enabled) return;

    const hasWhitelisted = config.anti_raid?.whitelisted_roles?.some(roleId => 
        member.roles.cache.has(roleId)
    );
    if (hasWhitelisted) return;

    // Advanced anti-raid checks
    let isSuspicious = false;
    const suspiciousReasons = [];
    
    // Check account age
    if (config.anti_raid?.advanced?.min_account_age_days) {
        const accountAge = Date.now() - member.user.createdTimestamp;
        const accountAgeDays = accountAge / (1000 * 60 * 60 * 24);
        
        if (accountAgeDays < config.anti_raid.advanced.min_account_age_days) {
            isSuspicious = true;
            suspiciousReasons.push(`Account age: ${accountAgeDays.toFixed(1)} days`);
        }
    }
    
    // Check default avatar
    if (config.anti_raid?.advanced?.check_default_avatar) {
        if (!member.user.avatar) {
            isSuspicious = true;
            suspiciousReasons.push('No custom avatar');
        }
    }
    
    // Check username patterns
    if (config.anti_raid?.advanced?.suspicious_username_patterns) {
        for (const pattern of config.anti_raid.advanced.suspicious_username_patterns) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(member.user.username)) {
                isSuspicious = true;
                suspiciousReasons.push(`Suspicious username pattern: ${pattern}`);
                break;
            }
        }
    }

    // Log suspicious joins even when not in raid mode
    if (isSuspicious && config.anti_raid?.advanced?.log_suspicious_joins) {
        const suspiciousEmbed = new EmbedBuilder()
            .setTitle('⚠️ Suspicious Join Detected')
            .setDescription(`${member.user.tag} joined with suspicious indicators`)
            .addFields(
                { name: 'User', value: `${member.user.tag} (${member.user.id})` },
                { name: 'Reasons', value: suspiciousReasons.join('\n') },
                { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` }
            )
            .setColor(0xFFA500)
            .setTimestamp();
        
        await log(member.guild, suspiciousEmbed);
        logToFile('WARN', 'Suspicious user joined', { user: member.user.tag, reasons: suspiciousReasons });
    }

    const now = Date.now();
    const guildJoins = joinTracker.get(member.guild.id) || [];
    const recentJoins = guildJoins.filter(time => now - time < config.anti_raid.time_window * 1000);
    recentJoins.push(now);
    joinTracker.set(member.guild.id, recentJoins);

    if (recentJoins.length >= config.anti_raid.join_threshold) {
        if (!raidModeActive) {
            raidModeActive = true;
            
            const alertChannelId = config.anti_raid?.alert_channel_id || config.logging.channel_id;
            const alertChannel = member.guild.channels.cache.get(alertChannelId);
            
            if (alertChannel) {
                let alertMsg = config.anti_raid?.raid_alert_message || '🚨 RAID DETECTED';
                if (config.anti_raid?.ping_roles_on_raid?.length > 0) {
                    const mentions = config.anti_raid.ping_roles_on_raid.map(r => `<@&${r}>`).join(' ');
                    alertMsg = `${mentions}\n${alertMsg}`;
                }
                await alertChannel.send(alertMsg);
            }

            const logEmbed = new EmbedBuilder()
                .setTitle('🚨 RAID DETECTED')
                .setDescription(`${recentJoins.length} joins in ${config.anti_raid.time_window}s`)
                .addFields(
                    { name: 'Action', value: config.anti_raid.punishment },
                    { name: 'Threshold', value: `${config.anti_raid.join_threshold} joins` }
                )
                .setColor(config.logging?.colors?.antiraid_triggered || 0xFF0000)
                .setTimestamp();
            
            await log(member.guild, logEmbed);
            logToFile('ERROR', 'RAID DETECTED', { joins: recentJoins.length, threshold: config.anti_raid.join_threshold });

            if (config.anti_raid?.auto_disable_after_minutes > 0) {
                if (raidModeTimeout) clearTimeout(raidModeTimeout);
                raidModeTimeout = setTimeout(() => {
                    raidModeActive = false;
                    joinTracker.delete(member.guild.id);
                    logToFile('INFO', 'Raid mode auto-disabled');
                }, config.anti_raid.auto_disable_after_minutes * 60 * 1000);
            }
        }

        // Lockdown mode - kick everyone during raid
        if (config.anti_raid?.advanced?.lockdown_mode) {
            try {
                await member.kick('Lockdown mode - Raid protection');
                logToFile('WARN', 'User kicked (lockdown mode)', { user: member.user.tag });
                return;
            } catch (error) {
                logToFile('ERROR', 'Kick failed (lockdown)', { error: error.message });
            }
        }

        // Kick new accounts during raid
        if (config.anti_raid?.advanced?.kick_new_accounts && isSuspicious) {
            try {
                await member.kick('Suspicious account during raid');
                logToFile('WARN', 'Suspicious user kicked during raid', { user: member.user.tag });
                return;
            } catch (error) {
                logToFile('ERROR', 'Kick failed (suspicious)', { error: error.message });
            }
        }

        if (config.anti_raid.punishment === 'kick') {
            try {
                await member.kick('Anti-raid protection');
                logToFile('WARN', 'User kicked (anti-raid)', { user: member.user.tag });
            } catch (error) {
                logToFile('ERROR', 'Kick error', { error: error.message });
            }
        } else if (config.anti_raid.punishment === 'ban') {
            try {
                await member.ban({ 
                    reason: 'Anti-raid protection',
                    deleteMessageDays: config.anti_raid?.delete_message_days || 1
                });
                logToFile('WARN', 'User banned (anti-raid)', { user: member.user.tag });
            } catch (error) {
                logToFile('ERROR', 'Ban error', { error: error.message });
            }
        }

        if (config.anti_raid?.enable_verification && config.anti_raid?.verification_role_id) {
            try {
                await member.roles.add(config.anti_raid.verification_role_id);
            } catch (error) {
                logToFile('ERROR', 'Verification role error', { error: error.message });
            }
        }
    }

    if (config.logging?.log_member_events) {
        const joinEmbed = new EmbedBuilder()
            .setTitle('👋 Member Joined')
            .setDescription(`${member.user.tag} joined`)
            .addFields(
                { name: 'User ID', value: member.user.id },
                { name: 'Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>` }
            )
            .setColor(config.logging?.colors?.member_join || 0x00FF00)
            .setTimestamp();
        
        if (isSuspicious) {
            joinEmbed.addFields({ name: '⚠️ Suspicious', value: suspiciousReasons.join('\n') });
        }
        
        await log(member.guild, joinEmbed);
    }
});

client.on('guildMemberRemove', async (member) => {
    if (config.logging?.log_member_events) {
        const leaveEmbed = new EmbedBuilder()
            .setTitle('👋 Member Left')
            .setDescription(`${member.user.tag} left`)
            .addFields({ name: 'User ID', value: member.user.id })
            .setColor(config.logging?.colors?.member_leave || 0xFF0000)
            .setTimestamp();
        
        await log(member.guild, leaveEmbed);
    }
});

function checkCooldown(userId, commandName) {
    const cooldownAmount = (config.commands?.cooldown?.[commandName] || 0) * 1000;
    if (cooldownAmount === 0) return { onCooldown: false };

    if (!cooldowns.has(commandName)) {
        cooldowns.set(commandName, new Map());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(commandName);
    
    if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return { onCooldown: true, timeLeft: timeLeft.toFixed(1) };
        }
    }

    timestamps.set(userId, now);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);
    return { onCooldown: false };
}

function hasPermission(interaction, commandName) {
    if (config.owners.includes(interaction.user.id)) return true;

    if (commandName === 'infraction') {
        return interaction.member.roles.cache.has(config.roles.infraction_permission);
    } else if (commandName === 'staffinfraction') {
        return interaction.member.roles.cache.has(config.roles.staff_infraction_permission);
    } else if (['backup', 'restore', 'antiraid', 'clearcommands', 'deletebackup'].includes(commandName)) {
        return config.owners.includes(interaction.user.id);
    } else if (['removeinfraction', 'clearinfractions'].includes(commandName)) {
        return interaction.member.roles.cache.has(config.roles.infraction_permission);
    }

    return true;
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    try {
        if (config.commands?.enabled?.[commandName] === false) {
            return interaction.reply({ content: 'Command disabled.', ephemeral: true });
        }

        const cooldownCheck = checkCooldown(interaction.user.id, commandName);
        if (cooldownCheck.onCooldown) {
            const msg = config.custom_messages?.command_cooldown || '⏱️ Cooldown: {time}s';
            return interaction.reply({ content: msg.replace('{time}', cooldownCheck.timeLeft), ephemeral: true });
        }

        if (!hasPermission(interaction, commandName)) {
            logToFile('WARN', 'Permission denied', { user: interaction.user.tag, command: commandName });
            return interaction.reply({ content: config.custom_messages?.no_permission || '❌ No permission.', ephemeral: true });
        }

        logToFile('COMMAND', `Command executed: /${commandName}`, { 
            user: interaction.user.tag, 
            userId: interaction.user.id,
            channel: interaction.channel?.name 
        });

        if (commandName === 'infraction') await handleInfraction(interaction, false);
        else if (commandName === 'staffinfraction') await handleInfraction(interaction, true);
        else if (commandName === 'viewinfractions') await handleViewInfractions(interaction);
        else if (commandName === 'removeinfraction') await handleRemoveInfraction(interaction);
        else if (commandName === 'clearinfractions') await handleClearInfractions(interaction);
        else if (commandName === 'infractionstats') await handleInfractionStats(interaction);
        else if (commandName === 'bulkinfraction') await handleBulkInfraction(interaction);
        else if (commandName === 'exportinfractions') await handleExportInfractions(interaction);
        else if (commandName === 'editinfraction') await handleEditInfraction(interaction);
        else if (commandName === 'backup') await handleBackup(interaction);
        else if (commandName === 'restore') await handleRestore(interaction);
        else if (commandName === 'listbackups') await handleListBackups(interaction);
        else if (commandName === 'deletebackup') await handleDeleteBackup(interaction);
        else if (commandName === 'backupinfo') await handleBackupInfo(interaction);
        else if (commandName === 'antiraid') await handleAntiRaid(interaction);
        else if (commandName === 'antiraidstatus') await handleAntiRaidStatus(interaction);
        else if (commandName === 'clearcommands') await handleClearCommands(interaction);
        else if (commandName === 'restartbot') await handleRestartBot(interaction);
    } catch (error) {
        console.error('Command error:', error);
        logToFile('ERROR', 'Command execution error', { 
            command: commandName, 
            user: interaction.user.tag,
            error: error.message,
            stack: error.stack
        });
        
        const errorMsg = config.custom_messages?.error_occurred || '❌ Error occurred.';
        
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: errorMsg });
        } else {
            await interaction.reply({ content: errorMsg, ephemeral: true });
        }

        if (config.notifications?.notify_on_error) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('⚠️ Command Error')
                .setDescription(`Error: ${commandName}`)
                .addFields(
                    { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
                    { name: 'Error', value: error.message || 'Unknown' }
                )
                .setColor(config.logging?.colors?.error || 0xFF0000)
                .setTimestamp();
            
            await log(interaction.guild, errorEmbed);
        }
    }
});

async function handleInfraction(interaction, isStaffInfraction) {
    const user = interaction.options.getUser('user');
    const typeIndex = parseInt(interaction.options.getString('type'));
    const reason = interaction.options.getString('reason');
    const appealable = interaction.options.getString('appealable') === 'yes';
    
    // Collect all evidence links
    const evidenceLinks = [];
    for (let i = 1; i <= 3; i++) {
        const link = interaction.options.getString(`evidence${i}`);
        if (link) evidenceLinks.push(link);
    }
    
    // Collect all evidence files
    const evidenceFiles = [];
    for (let i = 1; i <= 3; i++) {
        const file = interaction.options.getAttachment(`evidence_file${i}`);
        if (file) evidenceFiles.push(file);
    }

    // Validate evidence files
    for (const file of evidenceFiles) {
        const fileSizeMB = file.size / (1024 * 1024);
        if (config.security?.max_evidence_file_size && fileSizeMB > config.security.max_evidence_file_size) {
            return interaction.reply({ content: `File "${file.name}" too large. Max: ${config.security.max_evidence_file_size}MB`, ephemeral: true });
        }

        if (config.security?.allowed_evidence_types?.length > 0) {
            if (!config.security.allowed_evidence_types.includes(file.contentType)) {
                return interaction.reply({ content: `Invalid file type for "${file.name}".`, ephemeral: true });
            }
        }
    }

    // Combine all evidence
    const allEvidence = [];
    evidenceLinks.forEach((link, index) => allEvidence.push(`[Link ${index + 1}](${link})`));
    evidenceFiles.forEach((file, index) => allEvidence.push(`[File ${index + 1}](${file.url})`));
    
    const evidenceText = allEvidence.length > 0 ? allEvidence.join('\n') : 'None provided';
    const evidenceFileUrls = evidenceFiles.map(f => f.url);

    if (config.security?.min_reason_length && reason.length < config.security.min_reason_length) {
        return interaction.reply({ content: `Reason must be at least ${config.security.min_reason_length} chars.`, ephemeral: true });
    }

    if (config.security?.max_reason_length && reason.length > config.security.max_reason_length) {
        return interaction.reply({ content: `Reason max ${config.security.max_reason_length} chars.`, ephemeral: true });
    }

    const infractionType = config.infraction_types[typeIndex];
    const member = await interaction.guild.members.fetch(user.id);
    await member.roles.add(infractionType.role_id);

    if (!infractions[user.id]) infractions[user.id] = [];

    const infractionId = infractions[user.id].length;
    const infractionData = {
        id: infractionId,
        type: infractionType.name,
        display_name: infractionType.display_name || infractionType.name,
        reason: reason,
        appealable: appealable,
        evidence: evidenceText,
        evidence_links: evidenceLinks,
        evidence_files: evidenceFileUrls,
        issuer: interaction.user.id,
        timestamp: Date.now(),
        is_staff: isStaffInfraction,
        removable: !isStaffInfraction
    };

    infractions[user.id].push(infractionData);
    saveInfractions();

    let customText = config.infraction_messages.civilian;
    if (isStaffInfraction) customText = config.infraction_messages.staff;

    const embed = new EmbedBuilder()
        .setTitle(`${infractionType.emoji || '⚠️'} ${isStaffInfraction ? 'Staff ' : ''}Infraction Issued`)
        .setDescription(customText)
        .addFields(
            { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'Type', value: infractionType.display_name || infractionType.name, inline: true },
            { name: 'Appealable', value: appealable ? 'Yes' : 'No', inline: true },
            { name: 'Reason', value: reason },
            { name: 'Evidence', value: evidenceText }
        )
        .setColor(infractionType.color || 0xFF0000)
        .setFooter({ text: `${config.infraction_embed?.footer_line_1}\n${config.infraction_embed?.footer_line_2}` });

    if (config.infraction_embed?.include_timestamp !== false) embed.setTimestamp();
    if (config.infraction_embed?.show_thumbnail) {
        if (config.infraction_embed?.thumbnail_url) {
            embed.setThumbnail(config.infraction_embed.thumbnail_url);
        } else {
            embed.setThumbnail(interaction.guild.iconURL());
        }
    }
    
    // Set first image as embed image if available
    if (evidenceFiles.length > 0) {
        embed.setImage(evidenceFiles[0].url);
    }

    const ephemeral = config.commands?.ephemeral_responses?.infraction ?? false;
    await interaction.reply({ embeds: [embed], ephemeral });

    const logEmbed = new EmbedBuilder()
        .setTitle(`📝 ${isStaffInfraction ? 'Staff ' : ''}Infraction Logged`)
        .addFields(
            { name: 'User', value: `${user.tag} (${user.id})` },
            { name: 'Issued By', value: `${interaction.user.tag} (${interaction.user.id})` },
            { name: 'Type', value: infractionType.display_name || infractionType.name },
            { name: 'Reason', value: reason },
            { name: 'Evidence', value: evidenceText },
            { name: 'ID', value: infractionId.toString() }
        )
        .setColor(config.logging?.colors?.[isStaffInfraction ? 'staff_infraction' : 'infraction'] || 0xFF0000)
        .setTimestamp();

    await log(interaction.guild, logEmbed);

    if (config.infraction_embed?.send_dm !== false) {
        try {
            await user.send({ embeds: [embed] });
        } catch (error) {
            if (config.infraction_embed?.dm_failed_message) {
                await interaction.followUp({ content: config.infraction_embed.dm_failed_message, ephemeral: true });
            }
        }
    }

    await createBotBackup();
}

async function handleViewInfractions(interaction) {
    const user = interaction.options.getUser('user');
    const userInfractions = infractions[user.id] || [];

    if (userInfractions.length === 0) {
        return interaction.reply({ content: 'No infractions.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle(`📋 Infractions: ${user.tag}`)
        .setColor(config.logging?.colors?.info || 0x0099FF)
        .setTimestamp();

    userInfractions.forEach(inf => {
        const issuer = client.users.cache.get(inf.issuer);
        const infractionType = config.infraction_types.find(t => t.name === inf.type);
        const emoji = infractionType?.emoji || '⚠️';
        
        // Handle both old and new evidence formats
        let evidenceDisplay = 'None provided';
        if (inf.evidence_links && inf.evidence_links.length > 0) {
            const links = inf.evidence_links.map((link, i) => `[Link ${i + 1}](${link})`);
            const files = (inf.evidence_files || []).map((file, i) => `[File ${i + 1}](${file})`);
            evidenceDisplay = [...links, ...files].join('\n');
        } else if (inf.evidence && inf.evidence !== 'None provided') {
            evidenceDisplay = inf.evidence;
        }
        
        embed.addFields({
            name: `${emoji} ID: ${inf.id} - ${inf.display_name || inf.type} ${inf.is_staff ? '(Staff)' : ''}`,
            value: `**Reason:** ${inf.reason}\n**Appealable:** ${inf.appealable ? 'Yes' : 'No'}\n**Evidence:**\n${evidenceDisplay}\n**By:** ${issuer ? issuer.tag : 'Unknown'}\n**Date:** <t:${Math.floor(inf.timestamp / 1000)}:F>`
        });
    });

    const ephemeral = config.commands?.ephemeral_responses?.viewinfractions ?? true;
    await interaction.reply({ embeds: [embed], ephemeral });
}

async function handleRemoveInfraction(interaction) {
    const user = interaction.options.getUser('user');
    const infractionId = interaction.options.getInteger('infraction_id');

    const userInfractions = infractions[user.id] || [];
    const infraction = userInfractions.find(inf => inf.id === infractionId);

    if (!infraction) {
        return interaction.reply({ content: config.custom_messages?.invalid_infraction_id || '❌ Not found.', ephemeral: true });
    }

    if (!infraction.removable) {
        return interaction.reply({ content: config.custom_messages?.cannot_remove_staff_infraction || '❌ Staff infraction.', ephemeral: true });
    }

    infractions[user.id] = userInfractions.filter(inf => inf.id !== infractionId);
    saveInfractions();

    const hasMoreOfType = infractions[user.id].some(inf => inf.type === infraction.type);
    if (!hasMoreOfType) {
        const typeConfig = config.infraction_types.find(t => t.name === infraction.type);
        if (typeConfig) {
            try {
                const member = await interaction.guild.members.fetch(user.id);
                await member.roles.remove(typeConfig.role_id);
            } catch (error) {
                console.error('Role remove error:', error);
            }
        }
    }

    const successMsg = config.custom_messages?.infraction_removed_success || `✅ Removed infraction ${infractionId}.`;
    const ephemeral = config.commands?.ephemeral_responses?.removeinfraction ?? true;
    await interaction.reply({ content: successMsg, ephemeral });

    const logEmbed = new EmbedBuilder()
        .setTitle('🗑️ Infraction Removed')
        .addFields(
            { name: 'User', value: `${user.tag} (${user.id})` },
            { name: 'Removed By', value: `${interaction.user.tag} (${interaction.user.id})` },
            { name: 'ID', value: infractionId.toString() },
            { name: 'Type', value: infraction.display_name || infraction.type }
        )
        .setColor(config.logging?.colors?.infraction_removed || 0x00FF00)
        .setTimestamp();

    await log(interaction.guild, logEmbed);
    await createBotBackup();
}

async function handleClearInfractions(interaction) {
    const user = interaction.options.getUser('user');
    const includeStaff = interaction.options.getBoolean('include_staff') || false;

    if (includeStaff && !config.owners.includes(interaction.user.id)) {
        return interaction.reply({ content: '❌ Only owners can clear staff infractions.', ephemeral: true });
    }

    const userInfractions = infractions[user.id] || [];
    let removedCount = 0;

    if (includeStaff) {
        removedCount = userInfractions.length;
        infractions[user.id] = [];
    } else {
        const before = userInfractions.length;
        infractions[user.id] = userInfractions.filter(inf => !inf.removable);
        removedCount = before - infractions[user.id].length;
    }

    saveInfractions();

    for (const type of config.infraction_types) {
        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.roles.remove(type.role_id);
        } catch (error) {
            console.error('Role remove error:', error);
        }
    }

    await interaction.reply({ content: `✅ Cleared ${removedCount} infraction(s).`, ephemeral: true });

    const logEmbed = new EmbedBuilder()
        .setTitle('🗑️ Infractions Cleared')
        .addFields(
            { name: 'User', value: `${user.tag} (${user.id})` },
            { name: 'By', value: `${interaction.user.tag} (${interaction.user.id})` },
            { name: 'Count', value: removedCount.toString() },
            { name: 'Include Staff', value: includeStaff ? 'Yes' : 'No' }
        )
        .setColor(config.logging?.colors?.infraction_removed || 0x00FF00)
        .setTimestamp();

    await log(interaction.guild, logEmbed);
    await createBotBackup();
}

async function handleInfractionStats(interaction) {
    const user = interaction.options.getUser('user');

    const embed = new EmbedBuilder()
        .setTitle('📊 Infraction Statistics')
        .setColor(config.logging?.colors?.info || 0x0099FF)
        .setTimestamp();

    if (user) {
        const userInfractions = infractions[user.id] || [];
        const type1 = userInfractions.filter(i => i.type === config.infraction_types[0].name).length;
        const type2 = userInfractions.filter(i => i.type === config.infraction_types[1].name).length;
        const type3 = userInfractions.filter(i => i.type === config.infraction_types[2].name).length;
        const staffInfs = userInfractions.filter(i => i.is_staff).length;

        embed.setDescription(`Stats for ${user.tag}`)
            .addFields(
                { name: 'Total', value: userInfractions.length.toString(), inline: true },
                { name: config.infraction_types[0].name, value: type1.toString(), inline: true },
                { name: config.infraction_types[1].name, value: type2.toString(), inline: true },
                { name: config.infraction_types[2].name, value: type3.toString(), inline: true },
                { name: 'Staff', value: staffInfs.toString(), inline: true }
            );
    } else {
        let totalInfractions = 0;
        let type1Count = 0;
        let type2Count = 0;
        let type3Count = 0;
        let staffCount = 0;

        for (const userId in infractions) {
            const userInfs = infractions[userId];
            totalInfractions += userInfs.length;
            type1Count += userInfs.filter(i => i.type === config.infraction_types[0].name).length;
            type2Count += userInfs.filter(i => i.type === config.infraction_types[1].name).length;
            type3Count += userInfs.filter(i => i.type === config.infraction_types[2].name).length;
            staffCount += userInfs.filter(i => i.is_staff).length;
        }

        embed.setDescription('Server-wide statistics')
            .addFields(
                { name: 'Users', value: Object.keys(infractions).length.toString(), inline: true },
                { name: 'Total', value: totalInfractions.toString(), inline: true },
                { name: config.infraction_types[0].name, value: type1Count.toString(), inline: true },
                { name: config.infraction_types[1].name, value: type2Count.toString(), inline: true },
                { name: config.infraction_types[2].name, value: type3Count.toString(), inline: true },
                { name: 'Staff', value: staffCount.toString(), inline: true }
            );
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleBulkInfraction(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const userIds = interaction.options.getString('user_ids').split(',').map(id => id.trim());
    const typeIndex = parseInt(interaction.options.getString('type'));
    const reason = interaction.options.getString('reason');
    const appealable = interaction.options.getString('appealable') === 'yes';

    const infractionType = config.infraction_types[typeIndex];
    let successCount = 0;
    let failCount = 0;

    for (const userId of userIds) {
        try {
            const member = await interaction.guild.members.fetch(userId);
            await member.roles.add(infractionType.role_id);

            if (!infractions[userId]) infractions[userId] = [];

            const infractionId = infractions[userId].length;
            infractions[userId].push({
                id: infractionId,
                type: infractionType.name,
                display_name: infractionType.display_name,
                reason: reason,
                appealable: appealable,
                evidence: 'Bulk infraction',
                evidence_file: null,
                issuer: interaction.user.id,
                timestamp: Date.now(),
                is_staff: false,
                removable: true
            });

            successCount++;
        } catch (error) {
            failCount++;
            console.error(`Bulk infraction error ${userId}:`, error);
        }
    }

    saveInfractions();

    await interaction.editReply(`✅ Bulk: ${successCount} success, ${failCount} failed.`);

    const logEmbed = new EmbedBuilder()
        .setTitle('📝 Bulk Infractions')
        .addFields(
            { name: 'By', value: `${interaction.user.tag} (${interaction.user.id})` },
            { name: 'Type', value: infractionType.display_name },
            { name: 'Reason', value: reason },
            { name: 'Success', value: successCount.toString(), inline: true },
            { name: 'Failed', value: failCount.toString(), inline: true }
        )
        .setColor(config.logging?.colors?.infraction || 0xFF0000)
        .setTimestamp();

    await log(interaction.guild, logEmbed);
    await createBotBackup();
}

async function handleExportInfractions(interaction) {
    const user = interaction.options.getUser('user');

    let exportData = user ? { [user.id]: infractions[user.id] || [] } : infractions;

    const json = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(json, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `infractions_${Date.now()}.json` });

    await interaction.reply({ content: '📤 Exported.', files: [attachment], ephemeral: true });
}

async function handleEditInfraction(interaction) {
    const user = interaction.options.getUser('user');
    const infractionId = interaction.options.getInteger('infraction_id');
    const newReason = interaction.options.getString('new_reason');
    const newEvidence = interaction.options.getString('new_evidence');
    const appealable = interaction.options.getString('appealable');

    const userInfractions = infractions[user.id] || [];
    const infraction = userInfractions.find(inf => inf.id === infractionId);

    if (!infraction) {
        return interaction.reply({ content: config.custom_messages?.invalid_infraction_id || '❌ Not found.', ephemeral: true });
    }

    if (newReason) infraction.reason = newReason;
    if (newEvidence) infraction.evidence = newEvidence;
    if (appealable) infraction.appealable = appealable === 'yes';

    saveInfractions();

    await interaction.reply({ content: '✅ Infraction updated.', ephemeral: true });

    const logEmbed = new EmbedBuilder()
        .setTitle('✏️ Infraction Edited')
        .addFields(
            { name: 'User', value: `${user.tag} (${user.id})` },
            { name: 'By', value: `${interaction.user.tag} (${interaction.user.id})` },
            { name: 'ID', value: infractionId.toString() }
        )
        .setColor(config.logging?.colors?.info || 0x0099FF)
        .setTimestamp();

    await log(interaction.guild, logEmbed);
    await createBotBackup();
}

async function handleBackup(interaction) {
    await interaction.deferReply({ ephemeral: config.commands?.ephemeral_responses?.backup ?? true });

    const guild = interaction.guild;
    const backup = {
        name: guild.name,
        icon: guild.iconURL(),
        roles: [],
        channels: [],
        timestamp: Date.now(),
        creator: interaction.user.id
    };

    if (config.backup?.include?.roles !== false) {
        const sortedRoles = Array.from(guild.roles.cache.values())
            .sort((a, b) => b.position - a.position)
            .filter(role => role.id !== guild.id);

        for (const role of sortedRoles) {
            backup.roles.push({
                id: role.id,
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                position: role.position,
                permissions: role.permissions.bitfield.toString(),
                mentionable: role.mentionable
            });
        }
    }

    if (config.backup?.include?.channels !== false) {
        for (const channel of guild.channels.cache.values()) {
            const channelData = {
                id: channel.id,
                name: channel.name,
                type: channel.type,
                position: channel.position,
                parentId: channel.parentId,
                permissionOverwrites: []
            };

            if (channel.topic) channelData.topic = channel.topic;
            if (channel.nsfw !== undefined) channelData.nsfw = channel.nsfw;
            if (channel.rateLimitPerUser) channelData.rateLimitPerUser = channel.rateLimitPerUser;

if (config.backup?.include?.permissions !== false && channel.permissionOverwrites?.cache) {
    for (const overwrite of channel.permissionOverwrites.cache.values()) {
        channelData.permissionOverwrites.push({
            id: overwrite.id,
            type: overwrite.type,
            allow: overwrite.allow.bitfield.toString(),
            deny: overwrite.deny.bitfield.toString()
        });
    }
}

            backup.channels.push(channelData);
        }
    }

    const backupName = `backup_${Date.now()}.json`;
    const backupPath = path.join(BACKUPS_DIR, backupName);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

    const backupFiles = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
    if (backupFiles.length > config.backup.max_backups) {
        const sortedBackups = backupFiles.sort();
        sortedBackups.slice(0, backupFiles.length - config.backup.max_backups).forEach(file => {
            fs.unlinkSync(path.join(BACKUPS_DIR, file));
        });
    }

    const successMsg = config.custom_messages?.backup_created_success || `✅ Backup: ${backupName}`;
    await interaction.editReply(successMsg);

    const logEmbed = new EmbedBuilder()
        .setTitle('💾 Backup Created')
        .addFields(
            { name: 'By', value: `${interaction.user.tag} (${interaction.user.id})` },
            { name: 'Name', value: backupName },
            { name: 'Roles', value: backup.roles.length.toString() },
            { name: 'Channels', value: backup.channels.length.toString() }
        )
        .setColor(config.logging?.colors?.backup_created || 0x00FF00)
        .setTimestamp();

    await log(guild, logEmbed);
}

async function createAutoBackup(guild) {
    try {
        const backup = {
            name: guild.name,
            icon: guild.iconURL(),
            roles: [],
            channels: [],
            timestamp: Date.now(),
            auto_backup: true
        };

        if (config.backup?.include?.roles !== false) {
            const sortedRoles = Array.from(guild.roles.cache.values())
                .sort((a, b) => b.position - a.position)
                .filter(role => role.id !== guild.id);

            for (const role of sortedRoles) {
                backup.roles.push({
                    id: role.id,
                    name: role.name,
                    color: role.color,
                    hoist: role.hoist,
                    position: role.position,
                    permissions: role.permissions.bitfield.toString(),
                    mentionable: role.mentionable
                });
            }
        }

        if (config.backup?.include?.channels !== false) {
            for (const channel of guild.channels.cache.values()) {
                const channelData = {
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    position: channel.position,
                    parentId: channel.parentId,
                    permissionOverwrites: []
                };

                if (channel.topic) channelData.topic = channel.topic;
                if (channel.nsfw !== undefined) channelData.nsfw = channel.nsfw;
                if (channel.rateLimitPerUser) channelData.rateLimitPerUser = channel.rateLimitPerUser;

                if (config.backup?.include?.permissions !== false) {
                    for (const overwrite of channel.permissionOverwrites.cache.values()) {
                        channelData.permissionOverwrites.push({
                            id: overwrite.id,
                            type: overwrite.type,
                            allow: overwrite.allow.bitfield.toString(),
                            deny: overwrite.deny.bitfield.toString()
                        });
                    }
                }

                backup.channels.push(channelData);
            }
        }

        const backupName = `auto_backup_${Date.now()}.json`;
        const backupPath = path.join(BACKUPS_DIR, backupName);
        fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

        const backupFiles = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));
        if (backupFiles.length > config.backup.max_backups) {
            const sortedBackups = backupFiles.sort();
            sortedBackups.slice(0, backupFiles.length - config.backup.max_backups).forEach(file => {
                fs.unlinkSync(path.join(BACKUPS_DIR, file));
            });
        }

        if (config.backup?.notify_on_auto_backup) {
            const logEmbed = new EmbedBuilder()
                .setTitle('💾 Auto Backup Created')
                .addFields(
                    { name: 'Name', value: backupName },
                    { name: 'Roles', value: backup.roles.length.toString() },
                    { name: 'Channels', value: backup.channels.length.toString() }
                )
                .setColor(config.logging?.colors?.backup_created || 0x00FF00)
                .setTimestamp();

            await log(guild, logEmbed);
        }
    } catch (error) {
        console.error('Auto backup error:', error);
    }
}

async function handleRestore(interaction) {
    const backupName = interaction.options.getString('backup_name');
    const backupPath = path.join(BACKUPS_DIR, backupName);

    if (!fs.existsSync(backupPath)) {
        return interaction.reply({ content: config.custom_messages?.no_backups_found || '❌ Not found.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: config.commands?.ephemeral_responses?.restore ?? true });

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const guild = interaction.guild;

    try {
        for (const role of guild.roles.cache.values()) {
            if (role.id !== guild.id && !role.managed) {
                try {
                    await role.delete();
                } catch (e) {
                    if (config.advanced?.debug_mode) console.error('Role delete:', e);
                }
            }
        }

        for (const channel of guild.channels.cache.values()) {
            try {
                await channel.delete();
            } catch (e) {
                if (config.advanced?.debug_mode) console.error('Channel delete:', e);
            }
        }

        const roleMap = new Map();
        for (const roleData of backup.roles.reverse()) {
            try {
                const newRole = await guild.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: roleData.permissions,
                    mentionable: roleData.mentionable
                });
                roleMap.set(roleData.id, newRole.id);
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (e) {
                if (config.advanced?.debug_mode) console.error('Role create:', e);
            }
        }

        const channelMap = new Map();
        
        for (const channelData of backup.channels.filter(c => c.type === ChannelType.GuildCategory)) {
            try {
                const newChannel = await guild.channels.create({
                    name: channelData.name,
                    type: channelData.type,
                    position: channelData.position
                });
                channelMap.set(channelData.id, newChannel.id);
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (e) {
                if (config.advanced?.debug_mode) console.error('Category create:', e);
            }
        }

        for (const channelData of backup.channels.filter(c => c.type !== ChannelType.GuildCategory)) {
            try {
                const createData = {
                    name: channelData.name,
                    type: channelData.type,
                    position: channelData.position,
                    parent: channelData.parentId ? channelMap.get(channelData.parentId) : null
                };

                if (channelData.topic) createData.topic = channelData.topic;
                if (channelData.nsfw !== undefined) createData.nsfw = channelData.nsfw;
                if (channelData.rateLimitPerUser) createData.rateLimitPerUser = channelData.rateLimitPerUser;

                const newChannel = await guild.channels.create(createData);
                channelMap.set(channelData.id, newChannel.id);

                for (const overwrite of channelData.permissionOverwrites) {
                    try {
                        const targetId = overwrite.type === 0 ? roleMap.get(overwrite.id) || overwrite.id : overwrite.id;
                        await newChannel.permissionOverwrites.create(targetId, {
                            allow: BigInt(overwrite.allow),
                            deny: BigInt(overwrite.deny)
                        });
                    } catch (e) {
                        if (config.advanced?.debug_mode) console.error('Permission overwrite:', e);
                    }
                }
                
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (e) {
                if (config.advanced?.debug_mode) console.error('Channel create:', e);
            }
        }

        const logChannelName = config.logging.channel_name || 'bot-logs';
        const newLogChannel = guild.channels.cache.find(c => c.name === logChannelName);
        if (newLogChannel) {
            config.logging.channel_id = newLogChannel.id;
            fs.writeFileSync('./config.yml', yaml.dump(config, { indent: 2, lineWidth: -1 }));
        }

        const successMsg = config.custom_messages?.backup_restored_success || '✅ Backup restored!';
        await interaction.editReply(successMsg);

        const logEmbed = new EmbedBuilder()
            .setTitle('🔄 Backup Restored')
            .addFields(
                { name: 'By', value: `${interaction.user.tag} (${interaction.user.id})` },
                { name: 'Name', value: backupName },
                { name: 'Date', value: `<t:${Math.floor(backup.timestamp / 1000)}:F>` }
            )
            .setColor(config.logging?.colors?.backup_restored || 0x0099FF)
            .setTimestamp();

        await log(guild, logEmbed);
    } catch (error) {
        console.error('Restore error:', error);
        await interaction.editReply('❌ Error restoring backup.');
        
        if (config.notifications?.notify_on_error) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('⚠️ Restore Error')
                .setDescription(`Failed: ${backupName}`)
                .addFields(
                    { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
                    { name: 'Error', value: error.message || 'Unknown' }
                )
                .setColor(config.logging?.colors?.error || 0xFF0000)
                .setTimestamp();
            
            await log(interaction.guild, errorEmbed);
        }
    }
}

async function handleListBackups(interaction) {
    const backupFiles = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json'));

    if (backupFiles.length === 0) {
        return interaction.reply({ content: config.custom_messages?.no_backups_found || '❌ No backups.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
        .setTitle('📁 Available Backups')
        .setDescription(`Total: ${backupFiles.length}/${config.backup.max_backups}`)
        .setColor(config.logging?.colors?.info || 0x0099FF)
        .setTimestamp();

    backupFiles.sort().reverse().forEach((file, index) => {
        if (index < 25) {
            const backupPath = path.join(BACKUPS_DIR, file);
            const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
            const date = new Date(backup.timestamp);
            const isAuto = backup.auto_backup ? '🤖 ' : '';
            
            embed.addFields({
                name: `${isAuto}${file}`,
                value: `📅 ${date.toLocaleString()}\n📊 Roles: ${backup.roles.length} | Channels: ${backup.channels.length}${backup.creator ? `\n👤 By: <@${backup.creator}>` : ''}`
            });
        }
    });

    if (backupFiles.length > 25) {
        embed.setFooter({ text: `Showing 25 of ${backupFiles.length}` });
    }

    const ephemeral = config.commands?.ephemeral_responses?.listbackups ?? true;
    await interaction.reply({ embeds: [embed], ephemeral });
}

async function handleDeleteBackup(interaction) {
    const backupName = interaction.options.getString('backup_name');
    const backupPath = path.join(BACKUPS_DIR, backupName);

    if (!fs.existsSync(backupPath)) {
        return interaction.reply({ content: config.custom_messages?.no_backups_found || '❌ Not found.', ephemeral: true });
    }

    fs.unlinkSync(backupPath);

    await interaction.reply({ content: `✅ Deleted: ${backupName}`, ephemeral: true });

    const logEmbed = new EmbedBuilder()
        .setTitle('🗑️ Backup Deleted')
        .addFields(
            { name: 'By', value: `${interaction.user.tag} (${interaction.user.id})` },
            { name: 'Name', value: backupName }
        )
        .setColor(config.logging?.colors?.warning || 0xFFA500)
        .setTimestamp();

    await log(interaction.guild, logEmbed);
}

async function handleBackupInfo(interaction) {
    const backupName = interaction.options.getString('backup_name');
    const backupPath = path.join(BACKUPS_DIR, backupName);

    if (!fs.existsSync(backupPath)) {
        return interaction.reply({ content: config.custom_messages?.no_backups_found || '❌ Not found.', ephemeral: true });
    }

    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    const embed = new EmbedBuilder()
        .setTitle(`📋 Backup Info: ${backupName}`)
        .addFields(
            { name: 'Server', value: backup.name, inline: true },
            { name: 'Created', value: `<t:${Math.floor(backup.timestamp / 1000)}:F>`, inline: true },
            { name: 'Type', value: backup.auto_backup ? 'Auto' : 'Manual', inline: true },
            { name: 'Roles', value: backup.roles.length.toString(), inline: true },
            { name: 'Channels', value: backup.channels.length.toString(), inline: true },
            { name: 'Creator', value: backup.creator ? `<@${backup.creator}>` : 'N/A', inline: true }
        )
        .setColor(config.logging?.colors?.info || 0x0099FF)
        .setTimestamp();

    if (backup.icon) embed.setThumbnail(backup.icon);

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleAntiRaid(interaction) {
    const action = interaction.options.getString('action');
    config.anti_raid.enabled = action === 'enable';

    fs.writeFileSync('./config.yml', yaml.dump(config, { indent: 2, lineWidth: -1 }));

    if (action === 'enable') {
        raidModeActive = false;
        joinTracker.clear();
    }

    const message = action === 'enable' ? 
        (config.custom_messages?.antiraid_enabled || '✅ Anti-raid enabled.') :
        (config.custom_messages?.antiraid_disabled || '🔴 Anti-raid disabled.');

    const ephemeral = config.commands?.ephemeral_responses?.antiraid ?? true;
    await interaction.reply({ content: message, ephemeral });

    const logEmbed = new EmbedBuilder()
        .setTitle('🛡️ Anti-Raid Updated')
        .addFields(
            { name: 'By', value: `${interaction.user.tag} (${interaction.user.id})` },
            { name: 'Status', value: action === 'enable' ? 'Enabled ✅' : 'Disabled 🔴' }
        )
        .setColor(action === 'enable' ? 0x00FF00 : 0xFF0000)
        .setTimestamp();

    await log(interaction.guild, logEmbed);
}

async function handleAntiRaidStatus(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('🛡️ Anti-Raid Status')
        .addFields(
            { name: 'System', value: config.anti_raid.enabled ? '✅ Enabled' : '🔴 Disabled', inline: true },
            { name: 'Raid Mode', value: raidModeActive ? '⚠️ Active' : '✅ Inactive', inline: true },
            { name: 'Threshold', value: config.anti_raid.join_threshold.toString(), inline: true },
            { name: 'Time Window', value: `${config.anti_raid.time_window}s`, inline: true },
            { name: 'Punishment', value: config.anti_raid.punishment, inline: true },
            { name: 'Auto Disable', value: config.anti_raid.auto_disable_after_minutes > 0 ? `${config.anti_raid.auto_disable_after_minutes}m` : 'Manual', inline: true }
        )
        .setColor(config.anti_raid.enabled ? 0x00FF00 : 0xFF0000)
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleClearCommands(interaction) {
    await interaction.deferReply({ ephemeral: config.commands?.ephemeral_responses?.clearcommands ?? true });

    try {
        const rest = new REST({ version: '10' }).setToken(config.bot_token);
        
        await rest.put(Routes.applicationGuildCommands(client.user.id, config.guild_id), { body: [] });
        
        console.log('✅ Commands cleared');
        logToFile('INFO', 'All commands cleared', { user: interaction.user.tag });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await registerCommands(interaction.guild);
        
        const message = config.custom_messages?.commands_cleared || '✅ Commands cleared and re-registered.';
        await interaction.editReply(message);

        const logEmbed = new EmbedBuilder()
            .setTitle('🔄 Commands Reset')
            .addFields({ name: 'By', value: `${interaction.user.tag} (${interaction.user.id})` })
            .setColor(config.logging?.colors?.info || 0x0099FF)
            .setTimestamp();

        await log(interaction.guild, logEmbed);
    } catch (error) {
        console.error('Clear commands error:', error);
        logToFile('ERROR', 'Clear commands failed', { error: error.message });
        await interaction.editReply('❌ Error clearing commands.');
    }
}

async function handleRestartBot(interaction) {
    const ephemeral = config.commands?.ephemeral_responses?.restartbot ?? true;
    
    if (!config.advanced?.restart?.enabled) {
        return interaction.reply({ 
            content: '❌ Bot restart is disabled in configuration.', 
            ephemeral: true 
        });
    }

    await interaction.reply({ 
        content: config.custom_messages?.bot_restarting || '🔄 Bot is restarting...', 
        ephemeral 
    });

    logToFile('WARN', 'Bot restart initiated', { user: interaction.user.tag, userId: interaction.user.id });

    const logEmbed = new EmbedBuilder()
        .setTitle('🔄 Bot Restart Initiated')
        .addFields({ name: 'By', value: `${interaction.user.tag} (${interaction.user.id})` })
        .setColor(config.logging?.colors?.warning || 0xFFA500)
        .setTimestamp();

    await log(interaction.guild, logEmbed);

    // Notify restart in notification channel
    if (config.notifications?.notify_on_restart) {
        await sendNotification(
            interaction.guild, 
            config.notifications.restart_message || '🔄 Bot is restarting...', 
            0xFFA500
        );
    }

    // Save before restart
    if (config.advanced?.restart?.save_before_restart) {
        saveInfractions();
        logToFile('INFO', 'Data saved before restart');
    }

    // Create backup before restart
    if (config.advanced?.restart?.create_backup_before_restart) {
        await createBotBackup();
        logToFile('INFO', 'Backup created before restart');
    }

    // Wait a moment for messages to send
    await new Promise(resolve => setTimeout(resolve, 2000));

    logToFile('INFO', 'Bot restarting now...');
    
    // Destroy client and exit
    client.destroy();
    process.exit(0);
}

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    
    if (config.notifications?.notify_on_shutdown) {
        const guild = client.guilds.cache.get(config.guild_id);
        if (guild) {
            await sendNotification(guild, config.notifications.shutdown_message || '🔴 Shutting down...', 0xFF0000);
        }
    }
    
    saveInfractions();
    await createBotBackup();
    client.destroy();
    process.exit(0);
});

// Extract config values
const PREFIX = config.session_management.prefix;
const ALLOWED_ROLE_ID = config.roles.session_host_role;
const EARLY_ACCESS_ROLES = config.roles.early_access_roles;
const SERVER_NAME = config.session_management.server_name;
const CHANNELS = config.session_management.channels;
const IMAGES = config.session_management.images;
const EMBED_COLOR = config.session_management.embed_color;
const FOOTER_TEXT = config.session_management.footer_text;

// Store co-hosts and early access links
const coHosts = new Map();
const earlyAccessLinks = new Map();

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    const commands = [
        {
            name: 'startup',
            description: 'Start the session'
        },
        {
            name: 'setup',
            description: 'Set the session up'
        },
        {
            name: 'earlyaccess',
            description: 'Let early access join'
        },
        {
            name: 'release',
            description: 'Release the session'
        },
        {
            name: 'cancel',
            description: 'Cancel the session'
        },
        {
            name: 'end',
            description: 'End the session'
        }
    ];

    try {
        await client.application.commands.set(commands);
        console.log('✅ Slash commands registered successfully!');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
});

// Handle prefix commands
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const hasRole = message.member.roles.cache.has(ALLOWED_ROLE_ID);
    if (!hasRole) {
        return message.reply('❌ You do not have permission to use this command!').then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
    }

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // CO-HOST COMMAND
    if (command === 'co') {
        const mention = args[0];
        
        if (!mention || (!mention.startsWith('<@') && !mention.endsWith('>'))) {
            return message.reply('❌ Please mention a user! Example: `;co @username`').then(msg => {
                setTimeout(() => msg.delete(), 5000);
            });
        }

        coHosts.set(message.author.id, mention);
        message.delete().catch(console.error);
        
        return message.channel.send(`✅ Co-host set to ${mention} for your next session!`).then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
    }
});

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    // Check permissions
    if (!interaction.member.roles.cache.has(ALLOWED_ROLE_ID)) {
        return interaction.reply({ 
            content: '❌ You do not have permission to use this command!', 
            flags: MessageFlags.Ephemeral
        });
    }

    try {
        if (interaction.commandName === 'startup') {
            const modal = new ModalBuilder()
                .setCustomId('startup-modal')
                .setTitle('Startup Announcement');

            const confirmInput = new TextInputBuilder()
                .setCustomId('confirm')
                .setLabel('Type "confirm" to start session')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('confirm')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(confirmInput));
            await interaction.showModal(modal);
        }

        else if (interaction.commandName === 'setup') {
            const modal = new ModalBuilder()
                .setCustomId('setup-modal')
                .setTitle('Setup Announcement');

            const confirmInput = new TextInputBuilder()
                .setCustomId('confirm')
                .setLabel('Type "confirm" to announce setup')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('confirm')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(confirmInput));
            await interaction.showModal(modal);
        }

        else if (interaction.commandName === 'earlyaccess') {
            const modal = new ModalBuilder()
                .setCustomId('earlyaccess-modal')
                .setTitle('Early Access Announcement');

            const serverLinkInput = new TextInputBuilder()
                .setCustomId('serverLink')
                .setLabel('Early Access Server Link')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://...')
                .setRequired(true);

            const waitTimeInput = new TextInputBuilder()
                .setCustomId('waitTime')
                .setLabel('Time until Public Release')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., 5-10 Minutes')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(serverLinkInput),
                new ActionRowBuilder().addComponents(waitTimeInput)
            );
            await interaction.showModal(modal);
        }

        else if (interaction.commandName === 'release') {
            const modal = new ModalBuilder()
                .setCustomId('release-modal')
                .setTitle('Release Announcement');

            const serverLinkInput = new TextInputBuilder()
                .setCustomId('serverLink')
                .setLabel('Private Server Link')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://...')
                .setRequired(true);

            const peacetimeInput = new TextInputBuilder()
                .setCustomId('peacetime')
                .setLabel('Peacetime Status')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., Strict, Normal, Off')
                .setRequired(true);

            const speedsInput = new TextInputBuilder()
                .setCustomId('speeds')
                .setLabel('Speeds (Regular | Pullover | FRP)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., 45 | 60 | 75+')
                .setRequired(true);

            const houseClaimInput = new TextInputBuilder()
                .setCustomId('houseClaim')
                .setLabel('House Claiming (On/Off)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., On')
                .setRequired(true);

            const rpTypeInput = new TextInputBuilder()
                .setCustomId('rpType')
                .setLabel('Roleplay Type')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., Normal, Realistic')
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(serverLinkInput),
                new ActionRowBuilder().addComponents(peacetimeInput),
                new ActionRowBuilder().addComponents(speedsInput),
                new ActionRowBuilder().addComponents(houseClaimInput),
                new ActionRowBuilder().addComponents(rpTypeInput)
            );
            await interaction.showModal(modal);
        }

        else if (interaction.commandName === 'cancel') {
            const modal = new ModalBuilder()
                .setCustomId('cancel-modal')
                .setTitle('Session Cancellation');

            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason for Cancellation')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Explain why the session was cancelled')
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
            await interaction.showModal(modal);
        }

        else if (interaction.commandName === 'end') {
            const modal = new ModalBuilder()
                .setCustomId('end-modal')
                .setTitle('Session End Announcement');

            const timesInput = new TextInputBuilder()
                .setCustomId('times')
                .setLabel('Start & End Time')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., 3:00 PM - 5:30 PM')
                .setRequired(true);

            const ratingInput = new TextInputBuilder()
                .setCustomId('rating')
                .setLabel('Session Rating (1-5)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g., 4')
                .setRequired(true);

            const notesInput = new TextInputBuilder()
                .setCustomId('notes')
                .setLabel('Additional Notes')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(timesInput),
                new ActionRowBuilder().addComponents(ratingInput),
                new ActionRowBuilder().addComponents(notesInput)
            );
            await interaction.showModal(modal);
        }
    } catch (error) {
        console.error('Error showing modal:', error);
        if (!interaction.replied) {
            await interaction.reply({ 
                content: '❌ An error occurred while opening the form.', 
                flags: MessageFlags.Ephemeral
            }).catch(console.error);
        }
    }
});

// Handle modal submissions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    const guild = interaction.guild;
    const host = `<@${interaction.user.id}>`;

    try {
        // STARTUP MODAL
        if (interaction.customId === 'startup-modal') {
            await interaction.deferReply();

            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: SERVER_NAME,
                    iconURL: guild.iconURL()
                })
                .setTitle(`${SERVER_NAME} Startup`)
                .setDescription(`${host} is currently **attempting to Host** a **${SERVER_NAME} Session**. **Before** you join the **Roleplay**, please **review** our <#${CHANNELS.rules}> of the **Server** and all the **Information** that are **Listed** down Below. For this **Session** to **Start** we need to get **5+ Reactions** on this Message.`)
                .setColor(EMBED_COLOR)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: '• ', value: `**Read** over our <#${CHANNELS.roleplay_info}> to **see** the **Roleplay Information** of the **Server**.`, inline: false },
                    { name: '• ', value: `**Ensure** you have **all** your Vehicles **registered** in the <#${CHANNELS.vehicle_registration}> so you can **Provide** more **Tickets**.`, inline: false },
                    { name: '• ', value: `**Make sure** your **Roblox Profile Settings** are set to **"Everyone"** so you can **attend the Roleplay** of ${host}`, inline: false }
                )
                .setImage(IMAGES.startup)
                .setFooter({ text: FOOTER_TEXT })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }

        // SETUP MODAL
        else if (interaction.customId === 'setup-modal') {
            await interaction.deferReply();

            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: SERVER_NAME,
                    iconURL: guild.iconURL()
                })
                .setTitle(`${SERVER_NAME} Session Setup`)
                .setDescription(`${host} is now **Setting up his Session**, this can take up to **5-10 Minutes**. When the **Host is Ready** he will **Release** the **Early Access to his Session**. If you have any **Questions** regard to the **Tickets**.`)
                .setColor(EMBED_COLOR)
                .setThumbnail(guild.iconURL())
                .setImage(IMAGES.setup)
                .setFooter({ text: FOOTER_TEXT })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }

        // EARLY ACCESS MODAL
        else if (interaction.customId === 'earlyaccess-modal') {
            await interaction.deferReply();
            
            const serverLink = interaction.fields.getTextInputValue('serverLink');
            const waitTime = interaction.fields.getTextInputValue('waitTime');

            // Store early access link for button verification
            earlyAccessLinks.set(interaction.user.id, serverLink);

            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: SERVER_NAME,
                    iconURL: guild.iconURL()
                })
                .setTitle(`${SERVER_NAME} Early Access`)
                .setDescription(`${host} has now **Released** the **Early Access** to his **${SERVER_NAME} Session**. If you have the **Early Access role** or are a **Server Booster** you can now **join** the Session. The **Public Release** will be in **${waitTime}**.`)
                .setColor(EMBED_COLOR)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: '• Early Access Users:', value: 'LEO & STAFF & Server Boosters', inline: false },
                    { name: '• Public Release:', value: waitTime, inline: false }
                )
                .setImage(IMAGES.earlyaccess)
                .setFooter({ text: FOOTER_TEXT })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`early-access-join:${interaction.user.id}`)
                        .setLabel('Early Access Join')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🔗')
                );

            await interaction.editReply({ embeds: [embed], components: [row] });
        }

        // RELEASE MODAL
        else if (interaction.customId === 'release-modal') {
            await interaction.deferReply();

            const serverLink = interaction.fields.getTextInputValue('serverLink');
            const peacetime = interaction.fields.getTextInputValue('peacetime');
            const speeds = interaction.fields.getTextInputValue('speeds');
            const houseClaim = interaction.fields.getTextInputValue('houseClaim');
            const rpType = interaction.fields.getTextInputValue('rpType');

            // Get co-host if set
            const cohost = coHosts.get(interaction.user.id) || 'N/A';

            // Parse speeds
            const speedParts = speeds.split('|').map(s => s.trim());
            const regSpeed = speedParts[0] || 'N/A';
            const pullSpeed = speedParts[1] || 'N/A';
            const frpSpeed = speedParts[2] || 'N/A';

            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: SERVER_NAME,
                    iconURL: guild.iconURL()
                })
                .setTitle(`${SERVER_NAME} Release`)
                .setDescription(`${host} has now **Released** his **${SERVER_NAME} Session**, Before you join please review the Rules listed in <#${CHANNELS.rules}> and the Following Rules listed down below.\n\nAny **Kind of FRP** in the **Session** will be **Moderated and Punished**.`)
                .setColor(EMBED_COLOR)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: '• Session Host:', value: host, inline: true },
                    { name: '• Session Co-Host:', value: cohost, inline: true },
                    { name: '• Peacetime Status:', value: peacetime, inline: true },
                    { name: '• Regular Speedlimit:', value: regSpeed, inline: true },
                    { name: '• Pullover Speedlimit:', value: pullSpeed, inline: true },
                    { name: '• FRP Speeds:', value: frpSpeed, inline: true },
                    { name: '• House Claiming:', value: houseClaim, inline: true },
                    { name: '• Roleplay Type:', value: rpType, inline: true },
                    { name: '• Additional Notes:', value: 'N/A', inline: true }
                )
                .setImage(IMAGES.release)
                .setFooter({ text: FOOTER_TEXT })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Session Link')
                        .setStyle(ButtonStyle.Link)
                        .setURL(serverLink)
                        .setEmoji('🔗')
                );

            // Clear co-host and early access link after use
            coHosts.delete(interaction.user.id);
            earlyAccessLinks.delete(interaction.user.id);

            await interaction.editReply({ embeds: [embed], components: [row] });
        }

        // CANCEL MODAL
        else if (interaction.customId === 'cancel-modal') {
            await interaction.deferReply();
            
            const reason = interaction.fields.getTextInputValue('reason');

            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: SERVER_NAME,
                    iconURL: guild.iconURL()
                })
                .setTitle(`${SERVER_NAME} Session Cancel`)
                .setDescription(`${host} has **Canceled** his **${SERVER_NAME} Session**, you may **wait for another Session** to be **hosted** you can find the **Reason** why the Host has **canceled his Session**.\n\n**• Reason:** ${reason}\n\nIf you have **any Questions** regard to the **Tickets** !`)
                .setColor(EMBED_COLOR)
                .setThumbnail(guild.iconURL())
                .setImage(IMAGES.cancel)
                .setFooter({ text: SERVER_NAME })
                .setTimestamp();

            // Clear co-host and early access link if set
            coHosts.delete(interaction.user.id);
            earlyAccessLinks.delete(interaction.user.id);

            await interaction.editReply({ embeds: [embed] });
        }

        // END MODAL
        else if (interaction.customId === 'end-modal') {
            await interaction.deferReply();
            
            const times = interaction.fields.getTextInputValue('times');
            const rating = interaction.fields.getTextInputValue('rating');
            const notes = interaction.fields.getTextInputValue('notes');

            // Parse times
            const timeParts = times.split('-').map(t => t.trim());
            const startTime = timeParts[0] || 'N/A';
            const endTime = timeParts[1] || 'N/A';

            const embed = new EmbedBuilder()
                .setAuthor({ 
                    name: SERVER_NAME,
                    iconURL: guild.iconURL()
                })
                .setTitle(`${SERVER_NAME} Session End`)
                .setDescription(`${host} has now **Ended** their **${SERVER_NAME} Session**, down **below** you find the Length and the Rate of ${host} his **Session**.`)
                .setColor(EMBED_COLOR)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: '• Session Host:', value: host, inline: false },
                    { name: '• Session Start:', value: startTime, inline: false },
                    { name: '• Session End:', value: endTime, inline: false },
                    { name: '• Session Rating:', value: rating + ' ⭐', inline: false },
                    { name: '• Additional Notes:', value: notes, inline: false }
                )
                .setImage(IMAGES.end)
                .setFooter({ text: FOOTER_TEXT })
                .setTimestamp();

            // Clear co-host and early access link if set
            coHosts.delete(interaction.user.id);
            earlyAccessLinks.delete(interaction.user.id);

            await interaction.editReply({ 
                content: `Thank you ${host} for **Hosting a Session** on **${SERVER_NAME}**`,
                embeds: [embed] 
            });
        }

    } catch (error) {
        console.error('Modal submission error:', error);
        
        const errorMessage = '❌ An error occurred while processing your submission. Please try again.';
        
        if (interaction.deferred) {
            await interaction.editReply({ content: errorMessage }).catch(console.error);
        } else if (!interaction.replied) {
            await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral }).catch(console.error);
        }
    }
});

// Handle button interactions for early access
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('early-access-join:')) {
        const hostId = interaction.customId.split(':')[1];
        const serverLink = earlyAccessLinks.get(hostId);

        if (!serverLink) {
            return interaction.reply({
                content: '❌ Early access link is no longer available.',
                flags: MessageFlags.Ephemeral
            });
        }

        // Check if user has early access role
        const hasEarlyAccess = EARLY_ACCESS_ROLES.some(roleId => 
            interaction.member.roles.cache.has(roleId)
        );

        if (!hasEarlyAccess) {
            return interaction.reply({
                content: '❌ You do not have access to this early access session. You need one of the required roles (LEO, STAFF, or Server Booster).',
                flags: MessageFlags.Ephemeral
            });
        }

        // Send link as ephemeral message
        await interaction.reply({
            content: `🔗 **Early Access Link:** ${serverLink}`,
            flags: MessageFlags.Ephemeral
        });
    }
});

client.login(config.bot_token)
