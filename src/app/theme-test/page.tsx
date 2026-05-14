"use client";

import { useState } from "react";
import type { CollapseProps, TableProps, TabsProps } from "antd";
import {
  Alert,
  Badge,
  Button,
  Calendar,
  Card,
  Checkbox,
  Collapse,
  DatePicker,
  Divider,
  Flex,
  Form,
  Input,
  Modal,
  notification,
  Pagination,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";

type InvoiceRow = {
  key: string;
  date: string;
  status: string;
  total: string;
};

const { Title, Paragraph, Text } = Typography;

const cardStyle = { height: "100%" };
const sectionStyle = { padding: 24 };

const rows: InvoiceRow[] = [
  { key: "1", date: "22.04.2026", status: "Ödenmedi", total: "₺499,90" },
  { key: "2", date: "22.03.2026", status: "Ödendi", total: "₺449,90" },
  { key: "3", date: "22.02.2026", status: "Yasal takip", total: "₺399,90" },
];

const columns: TableProps<InvoiceRow>["columns"] = [
  { title: "Fatura Tarihi", dataIndex: "date" },
  { title: "Durum", dataIndex: "status" },
  { title: "Tutar", dataIndex: "total" },
  {
    title: "İşlem",
    render: () => <Button size="small">Hemen Öde</Button>,
  },
];

const tabItems: TabsProps["items"] = [
  { key: "internet", label: "İnternet", children: "Ev interneti paketleri" },
  { key: "tv", label: "TV+", children: "TV+ ve dijital servisler" },
  { key: "support", label: "Yardım", children: "Destek ve başvuru akışları" },
];

const collapseItems: CollapseProps["items"] = [
  {
    key: "1",
    label: "Aktif tema AntD bileşenlerine uygulanıyor mu?",
    children:
      "Bu sayfa ConfigProvider üzerinden gelen aktif tema token'larını test eder.",
  },
  {
    key: "2",
    label: "Figma sayfalarından hangi bileşenler maplendi?",
    children:
      "Button, Input, Select, Card, Modal, Table, Tabs, Menu, Form ve durum bileşenleri maplendi.",
  },
];

function ActionsShowcase() {
  return (
    <Card title="Buttons, Badge, Tooltip" style={cardStyle}>
      <Space wrap>
        <Button type="primary">Primary</Button>
        <Button>Secondary</Button>
        <Button type="dashed">Dashed</Button>
        <Button type="link">Link</Button>
        <Button disabled>Disabled</Button>
        <Tooltip title="Figma tooltip token testi">
          <Badge count={5}>
            <Button>Bildirimler</Button>
          </Badge>
        </Tooltip>
      </Space>
    </Card>
  );
}

function FormShowcase() {
  return (
    <Card title="Inputs, Select, Checkbox, Radio, Switch" style={cardStyle}>
      <Form layout="vertical">
        <Form.Item label="Müşteri numarası">
          <Input placeholder="1234567890" />
        </Form.Item>
        <Form.Item label="Paket tipi">
          <Select
            defaultValue="fiber"
            options={[
              { value: "fiber", label: "Fiber İnternet" },
              { value: "tv", label: "TV+" },
              { value: "mobile", label: "Mobil internet" },
            ]}
          />
        </Form.Item>
        <Form.Item label="Randevu tarihi">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Space direction="vertical">
          <Checkbox defaultChecked>Kampanya bilgilendirmesi</Checkbox>
          <Radio.Group defaultValue="monthly">
            <Radio value="monthly">Aylık</Radio>
            <Radio value="yearly">Yıllık</Radio>
          </Radio.Group>
          <Switch defaultChecked checkedChildren="Açık" unCheckedChildren="Kapalı" />
        </Space>
      </Form>
    </Card>
  );
}

function FeedbackShowcase() {
  const [api, contextHolder] = notification.useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Card title="Alert, Notification, Modal" style={cardStyle}>
      {contextHolder}
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          showIcon
          type="success"
          message="Ant Design Neon tema aktif"
          description="Success, info, warning ve error renkleri aktif tema token'larından geliyor."
        />
        <Alert showIcon type="warning" message="Uyarı durumu" />
        <Space wrap>
          <Button
            onClick={() =>
              api.info({
                message: "Notification testi",
                description: "Notification bileşeni aktif tema ile render edildi.",
              })
            }
          >
            Notification Aç
          </Button>
          <Button type="primary" onClick={() => setIsModalOpen(true)}>
            Modal Aç
          </Button>
        </Space>
      </Space>
      <Modal
        title="Popup / Modal Test"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => setIsModalOpen(false)}
      >
        <Paragraph>
          Popup sayfasındaki modal yaklaşımı AntD Modal token&apos;ları ile test
          ediliyor.
        </Paragraph>
      </Modal>
    </Card>
  );
}

function DataShowcase() {
  return (
    <Card title="Table, Tabs, Pagination" style={cardStyle}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Tabs defaultActiveKey="internet" items={tabItems} />
        <Table columns={columns} dataSource={rows} pagination={false} />
        <Pagination defaultCurrent={1} total={75} />
      </Space>
    </Card>
  );
}

function ContentShowcase() {
  return (
    <Card title="Cards, Calendar, Collapse" style={cardStyle}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card type="inner" title="Fiber 100 Mbps">
          <Flex justify="space-between" align="center" gap="middle" wrap>
            <div>
              <Text strong>₺499,90 / ay</Text>
              <Paragraph type="secondary" style={{ margin: 0 }}>
                24 ay taahhütlü, limitsiz internet.
              </Paragraph>
            </div>
            <Tag color="blue">Primary Card</Tag>
          </Flex>
        </Card>
        <Calendar fullscreen={false} />
        <Collapse items={collapseItems} defaultActiveKey={["1"]} />
      </Space>
    </Card>
  );
}

export default function ThemeTestPage() {
  return (
    <main style={sectionStyle}>
      <Flex vertical gap="large">
        <div>
          <Title level={1} style={{ marginBottom: 8 }}>
            Ant Design Theme Test
          </Title>
          <Paragraph type="secondary">
            Default Ant Design Neon teması ve seçilecek custom tema token&apos;ları bu
            sayfada birlikte test edilir.
          </Paragraph>
        </div>
        <Divider />
        <Flex gap="large" wrap>
          <div style={{ flex: "1 1 420px" }}>
            <ActionsShowcase />
          </div>
          <div style={{ flex: "1 1 420px" }}>
            <FormShowcase />
          </div>
          <div style={{ flex: "1 1 420px" }}>
            <FeedbackShowcase />
          </div>
          <div style={{ flex: "1 1 640px" }}>
            <DataShowcase />
          </div>
          <div style={{ flex: "1 1 640px" }}>
            <ContentShowcase />
          </div>
        </Flex>
      </Flex>
    </main>
  );
}
