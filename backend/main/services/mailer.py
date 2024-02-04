from bullmq import Queue

queue = Queue("myQueue")

# Add a job with data { "foo": "bar" } to the queue
await queue.add("myJob", {"foo": "bar"})

...

# Close when done adding jobs
await queue.close()
