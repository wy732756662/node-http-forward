FROM registry-vpc.cn-beijing.aliyuncs.com/rsq-public/node:8.11.3

LABEL name="rishiqing-http-navigator" \
       description="http forward server based on nodejs" \
       maintainer="Wallace Mao, Carry Wang, rishiqing group" \
       org="rishiqing"

# set default time zone to +0800 (Shanghai)
ENV TIME_ZONE=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TIME_ZONE /etc/localtime && echo $TIME_ZONE > /etc/timezone

# default config path
ENV NODE_CONFIG_DIR=/etc/rishiqing-http-navigator

WORKDIR /usr/src/rishiqing-http-navigator
COPY . .
RUN npm install --registry=https://registry.npm.taobao.org

# alinode for performance profiling
RUN npm install @alicloud/agenthub -g

# start alinode agent and index
EXPOSE 3000
CMD ["node", "server/index.js"]