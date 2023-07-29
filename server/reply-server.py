import os
import json
import time
import requests

from bilibili_api import comment, sync, video, Credential


# Server Configuration
HOST = '127.0.0.1:5000' # The port is shown on the terminal when you run the server
# localhost might cause problem
URI = f'http://{HOST}/api/v1/chat' # For local streaming, the websockets are hosted without ssl - http://

# Language Model Configuration
NAME = "B站网友"
DEBUG = False

def run(user_input, history):
    request = {
        'user_input': user_input,
        'max_new_tokens': 2048, #250
        'history': history,
        'mode': 'chat',  # Valid options: 'chat', 'chat-instruct', 'instruct'
        'character': 'ReplyAI',
        'instruction_template': 'Alpaca',
        'your_name': NAME,

        'regenerate': False,
        '_continue': False,
        'stop_at_newline': True,
        'chat_generation_attempts': 1,
        'chat-instruct_command': 'Continue the chat dialogue below. Write a single reply for the character "<|character|>".\n\n<|prompt|>',

        # Generation params. If 'preset' is set to different than 'None', the values
        # in presets/preset-name.yaml are used instead of the individual numbers.
        'preset': 'None',
        'do_sample': True,
        'temperature': 0.7,
        'top_p': 0.1,
        'typical_p': 1,
        'epsilon_cutoff': 0,  # In units of 1e-4
        'eta_cutoff': 0,  # In units of 1e-4
        'tfs': 1,
        'top_a': 0,
        'repetition_penalty': 1.18,
        'repetition_penalty_range': 0,
        'top_k': 40,
        'min_length': 0,
        'no_repeat_ngram_size': 0,
        'num_beams': 1,
        'penalty_alpha': 0,
        'length_penalty': 1,
        'early_stopping': False,
        'mirostat_mode': 0,
        'mirostat_tau': 5,
        'mirostat_eta': 0.1,

        'seed': 0,
        'add_bos_token': True,
        'truncation_length': 8192, #2048
        'ban_eos_token': False,
        'skip_special_tokens': True,
        'stopping_strings': []
    }

    response = requests.post(URI, json=request)

    if DEBUG:
        print(response)

    if response.status_code == 200:
        if DEBUG:
            print(json.dumps(response.json(), indent=4, ensure_ascii=False).encode('utf8').decode())
        return response.json()['results'][0]["history"]['visible'][-1][1]
    else:
        return None
    

async def scrape_unreplied_comments(aid, credential, stored_rpid_set, values):

    unreplied_comments = []
    page = 1

    while True:
        comment_page = await comment.get_comments(
            aid, 
            comment.CommentResourceType.VIDEO,
            page,
            credential=credential
        ) # Ranked by TIME (newest to oldest).

        new_comments = [c for c in comment_page['replies'] if not c["up_action"]["reply"] and c['rpid'] not in stored_rpid_set]
        for cmt in new_comments:
            print(f"{cmt['member']['uname']}: {cmt['content']['message']}")

        if len(new_comments) == 0:
            print("未回复评论已抓取完毕，共 %d 条。\n" % (len(unreplied_comments)))
            break

        unreplied_comments.extend(new_comments)
        page += 1

        time.sleep(3) # Wait for three seconds to avoid being banned by bilibili.

    return unreplied_comments
        

if __name__ == '__main__':
    
    with open("data/config.json", "r") as f:
        values = json.load(f)
    
    if os.path.exists('data/comments.json'):
        with open('data/comments.json', 'r') as f:
            stored_comments = json.load(f)
    else:
        stored_comments = []

    stored_rpid_set = {cmt['rpid'] for cmt in stored_comments}

    if DEBUG:
        print(stored_rpid_set)
    
    credential = Credential(
        sessdata=values["SESSDATA"], 
        bili_jct=values["bili_jct"], 
        buvid3=values["buvid3"], 
        dedeuserid=values["dedeuserid"]
    )

    v = video.Video(bvid=values['BVID'])
    aid = v.get_aid()

    unreplied_comments = sync(scrape_unreplied_comments(aid, credential, stored_rpid_set, values))

    history = {'internal': [], 'visible': []}
    
    if len(unreplied_comments) > 0:
        print("=============== 云若回复中 ===================")

    for cmt in unreplied_comments: # Test for 10 comment.
        print(f"{cmt['member']['uname']}: {cmt['content']['message']}")

        # send comment to text-generation-webui
        time_ckpt = time.time()
        user_input = cmt['content']['message']
        reply = run(user_input, history)

        if reply is not None:
            print("%s: %s (Time %d ms)\n" % ("云若", reply, (time.time() - time_ckpt) * 1000))
            cmt["reply"] = reply
            stored_comments.append(cmt)
        
        time.sleep(1) # Wait for one second to avoid crashing text-generation-webui server.

    print("云若回复完毕，正在存储...")
    with open("data/comments.json", "w") as f:
        json.dump(stored_comments, f, indent=4, ensure_ascii=False)